// components/trello-audit/Timeline.js
import React, { useEffect, useState, useRef } from 'react';
import styles from './Timeline.module.css';

export default function TimelineComponent({ card, onSelectCard }) {
  const [allActivities, setAllActivities] = useState([]); // All activities for details container
  const [filteredActivities, setFilteredActivities] = useState([]); // Filtered activities for timeline
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [allMembers, setAllMembers] = useState([]); // All unique members from all activities
  const [filteredMembers, setFilteredMembers] = useState([]); // Members related to selected linked card


  const [members, setMembers] = useState([]); // All members from linked cards
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingFilteredMembers, setIsLoadingFilteredMembers] = useState(false); // Loading state for filtered members

  const [allLinkedCards, setAllLinkedCards] = useState([]); // All linked cards recursively
  const timelineRef = useRef(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberActivities, setMemberActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [loadingMemberId, setLoadingMemberId] = useState(null);
  const [groupBy, setGroupBy] = useState('month');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedLinkedCard, setSelectedLinkedCard] = useState(null);

   const colors = ['#A9A9A9', '#708090', '#778899', '#B0C4DE', '#4682B4', '#5F9EA0'];
  const userColors = {};

  // Helper to assign colors to users
  function getUserColor(userId) {
    if (!userColors[userId]) {
      const index = Object.keys(userColors).length % colors.length;
      userColors[userId] = colors[index];
    }
    return userColors[userId];
  }

  const boardColors = {};

  // Helper to assign colors to boards
  function getBoardColor(boardName) {
    if (!boardColors[boardName]) {
      const index = Object.keys(boardColors).length % colors.length;
      boardColors[boardName] = colors[index];
    }
    return boardColors[boardName];
  }

  // Toggle group expansion
  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Classification for activity types
  const classifyTask = (type) => {
    const mapping = {
      updateCard: 'Card Updates',
      createCard: 'Card Creation',
      // Add other mappings as needed
    };
    return mapping[type] || 'Other';
  };

   // Fetch activities when the selected card changes
   useEffect(() => {
    if (card) {
      console.log('Fetching activities for card:', card.trello_id); // Debugging
      // Reset selections and data
      setSelectedMember(null);
      setSelectedLinkedCard(null);
      setAllActivities([]);
      setFilteredActivities([]);
      setAllMembers([]);
      setFilteredMembers([]);
      setDetailsData(null);
      setShowDetails(false);
      // Fetch activities for the new card
      fetchCardActivities(card.trello_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

   // Fetch all activities and linked cards for a given cardId
   const fetchCardActivities = async (cardId) => {
    if (!cardId) {
      console.error('Invalid cardId:', cardId);
      return;
    }
    try {
      console.log('Fetching card activities for cardId:', cardId); // Debugging

      setIsLoadingMembers(true);
      setIsLoadingActivities(true);
      setAllMembers([]);
      setFilteredMembers([]);
      setAllLinkedCards([]);
      setAllActivities([]);
      setFilteredActivities([]);
      setSelectedActivity(null);
      setDetailsData(null);
      setShowDetails(false);

      // Step 1: Fetch all linked card IDs recursively
      const linkedCardIds = await fetchAllLinkedCardIds(cardId);
      linkedCardIds.push(cardId); // Include the main card
      const uniqueCardIds = Array.from(new Set(linkedCardIds));

      // Step 2: Fetch details for all linked cards
      const cardDetailsPromises = uniqueCardIds.map((id) => fetchCardDetails(id));
      const linkedCardsDetails = await Promise.all(cardDetailsPromises);
      setAllLinkedCards(linkedCardsDetails);

      // Step 3: Fetch activities for all linked cards
      const cardActivitiesPromises = uniqueCardIds.map((id) => fetchActivities(id));
      const cardActivitiesArrays = await Promise.all(cardActivitiesPromises);
      const aggregatedActivities = cardActivitiesArrays.flat();

      // Step 4: Set allActivities to the aggregated list
      setAllActivities(aggregatedActivities);

      // Step 5: Apply filtering for the timeline chart
      const relevantActivities = filterListMovementActivities(aggregatedActivities);
      setFilteredActivities(relevantActivities);

      // Step 6: Extract unique members from all activities
      const allMembersExtracted = extractMembersFromActions(aggregatedActivities);
      setAllMembers(allMembersExtracted);

      setIsLoadingMembers(false);
      setIsLoadingActivities(false);
    } catch (error) {
      console.error('Error fetching card activities:', error);
      setIsLoadingMembers(false);
      setIsLoadingActivities(false);
    }
  };

   // Recursively fetch all linked card IDs
  const fetchAllLinkedCardIds = async (cardId, processedCardIds = new Set()) => {
    if (processedCardIds.has(cardId)) {
      return [];
    }

    processedCardIds.add(cardId);

    let linkedCardIds = [];

    try {
      const res = await fetch(`/api/trello-audit/card-attachments?cardId=${cardId}`);
      const data = await res.json();
      const attachments = data.attachments;

      const cardAttachments = attachments.filter(
        (attachment) => attachment.url && attachment.url.includes('https://trello.com/c/')
      );

      for (const attachment of cardAttachments) {
        const linkedCardId = await resolveCardId(attachment.url);
        if (linkedCardId && !processedCardIds.has(linkedCardId)) {
          linkedCardIds.push(linkedCardId);
          const moreLinkedCardIds = await fetchAllLinkedCardIds(linkedCardId, processedCardIds);
          linkedCardIds = linkedCardIds.concat(moreLinkedCardIds);
        }
      }

      return linkedCardIds;
    } catch (error) {
      console.error('Error fetching linked card IDs:', error);
      return [];
    }
  };

  // Resolve card ID from URL
  const resolveCardId = async (url) => {
    const regex = /https:\/\/trello\.com\/c\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    const shortLink = match ? match[1] : null;

    if (!shortLink) {
      console.error('Invalid Trello card URL:', url);
      return null;
    }

    try {
      const res = await fetch(`/api/trello-audit/resolve-card-id?shortLink=${shortLink}`);
      const data = await res.json();
      return data.cardId;
    } catch (error) {
      console.error('Error resolving card ID:', error);
      return null;
    }
  };

  // Fetch card details
  const fetchCardDetails = async (cardId) => {
    try {
      const res = await fetch(`/api/trello-audit/get-card-details?cardId=${cardId}`);
      const data = await res.json();

      // Ensure that the returned object always has an id
      return {
        id: data.id || cardId, // Fallback to the original cardId if data.id is undefined
        name: data.name || 'Unknown Card',
        boardName: data.board?.name || 'Unknown Board',
        listName: data.list?.name || 'Unknown List',
        shortLink: data.shortLink || '',
      };
    } catch (error) {
      console.error(`Error fetching card details for card ${cardId}:`, error);
      return {
        id: cardId, // Fallback to the original cardId even if details are unknown
        name: 'Unknown Card',
        boardName: 'Unknown Board',
        listName: 'Unknown List',
        shortLink: '',
      };
    }
  };

  // Fetch activities for a specific card
  const fetchActivities = async (cardId) => {
    try {
      const res = await fetch(`/api/trello-audit/card-activities?cardId=${cardId}`);
      const data = await res.json();
      return data.activities || [];
    } catch (error) {
      console.error(`Error fetching activities for card ${cardId}:`, error);
      return [];
    }
  };

   // Extract unique members from actions
   const extractMembersFromActions = (actions) => {
    const membersMap = {};
    actions.forEach((action) => {
      const member = action.memberCreator;
      if (member && member.id && member.fullName) {
        if (!membersMap[member.id]) {
          membersMap[member.id] = {
            id: member.id,
            fullName: member.fullName,
            initials: getInitials(member.fullName),
          };
        }
      }
    });
    return Object.values(membersMap);
  };

  // Helper function to get initials
  const getInitials = (fullName) => {
    const names = fullName.split(' ');
    const initials = names.map((name) => name.charAt(0).toUpperCase()).join('');
    return initials;
  };

  // Filter activities to include only list movements and card creation (for timeline)
  const filterListMovementActivities = (activities) => {
    return activities.filter(
      (action) =>
        (action.type === 'updateCard' && action.data?.listAfter?.name) ||
        action.type === 'createCard'
    );
  };
  

  // Handle member click to filter activities and linked cards
  const handleMemberClick = (member) => {
    if (selectedMember && selectedMember.id === member.id) {
      // Unselect member if clicked again
      setSelectedMember(null);
      setSelectedLinkedCard(null);
      setFilteredActivities(allActivities);
      // Reset linked cards to all
      setAllLinkedCards(allLinkedCardsOriginal);
      // No need to modify allMembers; projectCardMembersContainer will still show all
    } else {
      // Select new member
      setSelectedMember(member);
      setSelectedLinkedCard(null);

      // Filter activities for the selected member
      const memberActivities = allActivities.filter(
        (activity) => activity.memberCreator && activity.memberCreator.id === member.id
      );
      setFilteredActivities(memberActivities);

      // Filter linked cards based on member's activities
      const memberLinkedCardIds = new Set(
        memberActivities
          .filter((activity) => activity.data.card && activity.data.card.id)
          .map((activity) => activity.data.card.id)
      );
      const filteredLinkedCards = allLinkedCards.filter((card) =>
        memberLinkedCardIds.has(card.id)
      );
      setAllLinkedCards(filteredLinkedCards);
    }
  };

  // Handle linked card click to filter activities and update filteredMembers
  const handleCardFilterClick = (linkedCard) => {
    if (!linkedCard || !linkedCard.id) {
      console.error('Card ID is not defined:', linkedCard);
      return;
    }

    // If the clicked card is already selected, deselect it
    if (selectedLinkedCard && selectedLinkedCard.id === linkedCard.id) {
      setSelectedLinkedCard(null);
      setFilteredActivities(allActivities);
      // Reset linked cards to all if no member is selected
      if (!selectedMember) {
        setAllLinkedCards(allLinkedCardsOriginal);
      }
      setFilteredMembers([]);
      return;
    }

    // Select the linked card
    setSelectedLinkedCard(linkedCard);
    setSelectedMember(null);

    // Filter activities for the selected linked card
    const activitiesForCard = allActivities.filter(
      (activity) => activity.data.card && activity.data.card.id === linkedCard.id
    );
    setFilteredActivities(activitiesForCard);

    // Extract members who worked on the selected card
    const cardMembers = extractMembersFromActions(activitiesForCard);
    setFilteredMembers(cardMembers);
  };


  const fetchStepDetails = async (activity) => {
    try {
      const listName = activity.data?.listAfter?.name;
      if (!listName) {
        console.warn('No listAfter name found for this activity:', activity);
        setDetailsData(null);
        setShowDetails(false);
        return;
      }
  
      const res = await fetch(
        `/api/trello-audit/list-actions?cardId=${card.trello_id}&listName=${encodeURIComponent(
          listName
        )}&since=${encodeURIComponent(activity.date)}`
      );
      const data = await res.json();
      console.log('Fetched step details:', data);
  
      setDetailsData(data);
    } catch (error) {
      console.error('Error fetching step details:', error);
    }
  };
  

  // Handle activity click to show details
  const handleActivityClick = async (activity) => {
    setSelectedActivity(activity);
    await fetchStepDetails(activity);
    setShowDetails(true);
  };

  // Hide details modal
  const handleHideDetails = () => {
    setShowDetails(false);
    setDetailsData(null);
    setSelectedActivity(null);
  };

  // Calculate days spent in a list
  const calculateDaysInList = (currentActivity, nextActivity) => {
    const currentDate = new Date(currentActivity.date);
    const nextDate = nextActivity ? new Date(nextActivity.date) : new Date();
    const diffTime = Math.abs(nextDate - currentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Group activities by month
  const groupActivitiesByMonth = (activities) => {
    const grouped = {};
    activities.forEach((activity) => {
      const date = new Date(activity.date);
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(activity);
    });
    return grouped;
  };

  // Group activities by type
  const groupActivitiesByType = (activities) => {
    const grouped = {};
    activities.forEach((activity) => {
      const type = classifyTask(activity.type);
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(activity);
    });
    return grouped;
  };

  // Render activities based on grouping
  const renderActivities = () => {
    let groupedActivities;

    if (groupBy === 'month') {
      groupedActivities = groupActivitiesByMonth(filteredActivities);
    } else if (groupBy === 'type') {
      groupedActivities = groupActivitiesByType(filteredActivities);
    }

    return Object.entries(groupedActivities).map(([group, activities]) => (
      <div key={group}>
        <h5 onClick={() => toggleGroup(group)} className={styles.groupHeader}>
          {group}
        </h5>
        {expandedGroups[group] &&
          activities.map((activity) => {
            const actionDescription = getActionDescription(activity);
            const isActive = selectedActivity && selectedActivity.id === activity.id;
            const daysInList = calculateDaysInList(activity, activities[activities.indexOf(activity) + 1]);

            return (
              <div
                key={activity.id}
                className={`${styles.activityItem} ${isActive ? styles.activeActivityItem : ''}`}
                onClick={() => handleActivityClick(activity)}
              >
                <p>
                  <strong>{actionDescription || 'Performed an action.'}</strong> on{' '}
                  {new Date(activity.date).toLocaleString()}
                </p>
                <p>
                  By: {activity.memberCreator?.fullName || 'Unknown User'}
                </p>
                <p>
                  Card:{' '}
                  <a
                    href={`https://trello.com/c/${activity.data.card?.shortLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {activity.data.card?.name || 'Unknown'}
                  </a>
                </p>
                <p>
                  {activity.data.listBefore && activity.data.listAfter ? (
                    <>
                      Moved from <strong>{activity.data.listBefore.name}</strong> to{' '}
                      <strong>{activity.data.listAfter.name}</strong>
                    </>
                  ) : (
                    `Type: ${activity.type}`
                  )}
                </p>
                <p>Days in List: {daysInList} days</p>
              </div>
            );
          })}
      </div>
    ));
  };

  // Store original linked cards to reset filters
  const [allLinkedCardsOriginal, setAllLinkedCardsOriginal] = useState([]);

  useEffect(() => {
    // Whenever allLinkedCards is set for the first time, store it in allLinkedCardsOriginal
    if (allLinkedCards.length > 0 && allLinkedCardsOriginal.length === 0) {
      setAllLinkedCardsOriginal(allLinkedCards);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLinkedCards]);

  if (!card) {
    return (
      <div className={styles.timelineContainer}>
        <p>Select a card to view its timeline.</p>
      </div>
    );
  }
  // Render the component
  return (
    <div className={styles.timelineContainer}>
      {/* ProjectCard Members Container - Always Shows All Members */}
      <div className={styles.projectCardMembersContainer}>
        <h4 className={styles.MembersHeading}>Members of {card.name}</h4>
        {isLoadingMembers ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading Members...</p>
          </div>
        ) : allMembers.length > 0 ? (
          <div className={styles.projectCardMembers}>
            {allMembers.map((member) => (
              <div
                key={member.id}
                className={`${styles.memberIcon} ${
                  selectedMember && selectedMember.id === member.id ? styles.activeMemberIcon : ''
                }`}
                title={member.fullName}
                onClick={() => handleMemberClick(member)}
                style={{ backgroundColor: getUserColor(member.id) }}
              >
                {member.initials}
              </div>
            ))}
          </div>
        ) : (
          <p>No members associated with this ProjectCard.</p>
        )}
      </div>
      

       {/* Timeline */}
       <div className={styles.timelineWrapper} ref={timelineRef}>
        <div className={styles.timeline}>
          {filteredActivities.map((activity, index) => {
            const isActive = selectedActivity && selectedActivity.id === activity.id;
            const daysInList = calculateDaysInList(activity, filteredActivities[index + 1]);
            return (
              <div
                key={activity.id}
                className={`${styles.timelineItem} ${isActive ? styles.activeTimelineItem : ''}`}
                onClick={() => handleActivityClick(activity)}
              >
                <div className={styles.circle}></div>
                <div className={styles.stepName}>
                    {activity.data?.listAfter?.name || 'Unknown List'}
                    <div className={styles.daysInList}>{daysInList} days</div>
                </div>

                {index < filteredActivities.length - 1 && <div className={styles.line}></div>}
              </div>
            );
          })}
        </div>
      </div>
   
         {/* Details Container */}
      <div className={styles.detailsContainer}>
        {/* Filtered Members Container - Shows Members Related to Selected Linked Card */}
        {selectedLinkedCard && (
          <div className={styles.filteredMembersContainer}>
            <h4 className={styles.MembersHeading}>Members of Linked Card: {selectedLinkedCard.name}</h4>
            {isLoadingFilteredMembers ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading Members...</p>
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className={styles.filteredMembers}>
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`${styles.memberIcon} ${
                      selectedMember && selectedMember.id === member.id ? styles.activeMemberIcon : ''
                    }`}
                    title={member.fullName}
                    onClick={() => handleMemberClick(member)}
                    style={{ backgroundColor: getUserColor(member.id) }}
                  >
                    {member.initials}
                  </div>
                ))}
              </div>
            ) : (
              <p>No members associated with this Linked Card.</p>
            )}
          </div>
        )}
  

    {/* Card Filter - Show linked cards */}
    <div className={styles.cardFilterContainer}>
          <h4>Linked Cards</h4>
          {isLoadingActivities ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading Activities...</p>
            </div>
          ) : allLinkedCards.length > 0 ? (
            allLinkedCards.map((option) => {
              const boardColor = getBoardColor(option.boardName);
              const isActive = selectedLinkedCard && selectedLinkedCard.id === option.id;
              return (
                <div
                  key={option.id || option.shortLink} // Ensure unique key
                  className={`${styles.cardFilterItem} ${
                    isActive ? styles.activeCardFilterItem : ''
                  }`}
                  onClick={() => handleCardFilterClick(option)}
                  style={{ borderLeft: `4px solid ${boardColor}` }}
                >
                  <a
                    href={`https://trello.com/c/${option.shortLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardLink}
                  >
                    {option.name} ({option.boardName})
                  </a>
                </div>
              );
            })
          ) : (
            <p>No linked cards found.</p>
          )}
        </div>
      {/* Activity Data Container */}
      <div className={styles.activityDataContainer}>
          <div className={styles.groupByContainer}>
            <label>Group By: </label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="month">Month</option>
              <option value="type">Activity Type</option>
            </select>
          </div>

          {isLoadingActivities ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading Activities...</p>
            </div>
          ) : (
            <div className={styles.activities}>
              {filteredActivities.length > 0 ? (
                renderActivities()
              ) : (
                <p>No activities to display.</p>
              )}
            </div>
          )}
        </div>
      </div>


           



        {/* Details Modal */}
        {showDetails && detailsData && (
        <div className={styles.detailsModal}>
          <button onClick={handleHideDetails} className={styles.closeButton}>
            Hide Details
          </button>
          <h4>Details for "{selectedActivity.listAfter}"</h4>
          <ul>
            {detailsData.actions.map((action) => (
              <li key={action.id}>
                <p>
                  <strong>
                    {typeof getActionDescription(action) === 'string'
                      ? getActionDescription(action)
                      : getActionDescription(action).description}
                  </strong>{' '}
                  by{' '}
                  <span className={styles.authorIcon} title={action.memberCreator.fullName}>
                    {action.memberCreator.fullName.charAt(0)}
                  </span>{' '}
                  on {new Date(action.date).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper function remains outside the component
function getActionDescription(action) {
    if (!action || !action.type || !action.data) {
      return 'Unknown action';
    }
  
    const { type, data } = action;
    switch (type) {
      case 'acceptEnterpriseJoinRequest':
        return 'Accepted enterprise join request.';
      case 'addAttachmentToCard':
        return `Added attachment "${data.attachment.name}".`;
      case 'addChecklistToCard':
        return `Added checklist "${data.checklist.name}".`;
      case 'addMemberToBoard':
        return `Added member to board "${data.board.name}".`;
      case 'addMemberToCard':
        return `Added member to card "${data.card.name}".`;
      case 'addMemberToOrganization':
        return `Added member to organization "${data.organization.name}".`;
      case 'addOrganizationToEnterprise':
        return `Added organization to enterprise "${data.enterprise.name}".`;
      case 'addToEnterprisePluginWhitelist':
        return `Added plugin to enterprise whitelist.`;
      case 'addToOrganizationBoard':
        return `Added board to organization "${data.organization.name}".`;
      case 'commentCard':
        return `Commented: "${data.text}"`;
      case 'convertToCardFromCheckItem':
        return `Converted checklist item to card "${data.card.name}".`;
      case 'copyBoard':
        return `Copied board "${data.board.name}".`;
      case 'copyCard':
        return `Copied card "${data.card.name}".`;
      case 'copyCommentCard':
        return `Copied comment on card "${data.card.name}".`;
      case 'createBoard':
        return `Created board "${data.board.name}".`;
      case 'createCard':
        return `Created card "${data.card.name}".`;
      case 'createList':
        return `Created list "${data.list.name}".`;
      case 'createOrganization':
        return `Created organization "${data.organization.name}".`;
      case 'deleteBoardInvitation':
        return `Deleted board invitation.`;
      case 'deleteCard':
        return `Deleted card "${data.card.name}".`;
      case 'deleteOrganizationInvitation':
        return `Deleted organization invitation.`;
      case 'disableEnterprisePluginWhitelist':
        return `Disabled enterprise plugin whitelist.`;
      case 'disablePlugin':
        return `Disabled plugin.`;
      case 'disablePowerUp':
        return `Disabled Power-Up.`;
      case 'emailCard':
        return `Emailed card "${data.card.name}".`;
      case 'enableEnterprisePluginWhitelist':
        return `Enabled enterprise plugin whitelist.`;
      case 'enablePlugin':
        return `Enabled plugin.`;
      case 'enablePowerUp':
        return `Enabled Power-Up.`;
      case 'makeAdminOfBoard':
        return `Made admin of board "${data.board.name}".`;
      case 'makeNormalMemberOfBoard':
        return `Made normal member of board "${data.board.name}".`;
      case 'makeNormalMemberOfOrganization':
        return `Made normal member of organization "${data.organization.name}".`;
      case 'makeObserverOfBoard':
        return `Made observer of board "${data.board.name}".`;
      case 'memberJoinedTrello':
        return `Joined Trello.`;
      case 'moveCardFromBoard':
        return `Moved card "${data.card.name}" from board "${data.board.name}".`;
      case 'moveCardToBoard':
        return `Moved card "${data.card.name}" to board "${data.board.name}".`;
      case 'moveListFromBoard':
        return `Moved list "${data.list.name}" from board "${data.board.name}".`;
      case 'moveListToBoard':
        return `Moved list "${data.list.name}" to board "${data.board.name}".`;
      case 'removeChecklistFromCard':
        return `Removed checklist "${data.checklist.name}" from card "${data.card.name}".`;
      case 'removeFromEnterprisePluginWhitelist':
        return `Removed plugin from enterprise whitelist.`;
      case 'removeFromOrganizationBoard':
        return `Removed board from organization "${data.organization.name}".`;
      case 'removeMemberFromCard':
        return `Removed member from card "${data.card.name}".`;
      case 'removeOrganizationFromEnterprise':
        return `Removed organization from enterprise "${data.enterprise.name}".`;
      case 'unconfirmedBoardInvitation':
        return `Sent unconfirmed board invitation.`;
      case 'unconfirmedOrganizationInvitation':
        return `Sent unconfirmed organization invitation.`;
      case 'updateBoard':
        return `Updated board "${data.board.name}".`;
      case 'updateCard':
        if (data.old && data.old.desc !== undefined) {
          return 'Updated the description of the card.';
        } else if (data.listAfter) {
          return `Moved the card from "${data.listBefore.name}" to "${data.listAfter.name}".`;
        } else if (data.old && data.old.closed !== undefined) {
          return data.card.closed ? 'Archived the card.' : 'Unarchived the card.';
        } else if (data.old && data.old.name) {
          return `Renamed the card to "${data.card.name}".`;
        } else if (data.old && data.old.due !== undefined) {
          return data.card.due ? `Set due date to ${data.card.due}` : 'Removed due date.';
        } else {
          return 'Updated the card.';
        }
      case 'updateCheckItemStateOnCard':
        if (data.checkItem) {
          const state = data.checkItem.state === 'complete' ? 'completed' : 'incomplete';
          return `Marked checklist item "${data.checkItem.name}" as ${state}.`;
        } else {
          return 'Updated a checklist item state on the card.';
        }
      case 'updateChecklist':
        return `Updated checklist "${data.checklist.name}".`;
      case 'updateList':
        return `Updated list "${data.list.name}".`;
      case 'updateMember':
        return `Updated member profile.`;
      case 'updateOrganization':
        return `Updated organization "${data.organization.name}".`;
      default:
        // Handle any other action types not explicitly listed
        return `Performed action: ${type}.`;
    }
  }