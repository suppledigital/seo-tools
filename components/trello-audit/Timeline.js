// components/trello-audit/Timeline.js
import React, { useEffect, useState, useRef } from 'react';
import styles from './Timeline.module.css';

export default function TimelineComponent({ card }) {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [allLinkedCards, setAllLinkedCards] = useState([]);
  const timelineRef = useRef(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberActivities, setMemberActivities] = useState([]);
  const [showMemberDetails, setShowMemberDetails] = useState(true);
  const [activityCardOptions, setActivityCardOptions] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [loadingMemberId, setLoadingMemberId] = useState(null);
  const [selectedActivityCard, setSelectedActivityCard] = useState(null);
  const [groupBy, setGroupBy] = useState('month');
  const [expandedGroups, setExpandedGroups] = useState({});

  const colors = ['#A9A9A9', '#708090', '#778899', '#B0C4DE', '#4682B4', '#5F9EA0'];
  const userColors = {};
  const boardColors = {};

  // Helper to assign colors to users
  function getUserColor(userId) {
    if (!userColors[userId]) {
      const index = Object.keys(userColors).length % colors.length;
      userColors[userId] = colors[index];
    }
    return userColors[userId];
  }

  // Helper to assign colors to boards
  function getBoardColor(boardName) {
    if (!boardColors[boardName]) {
      const index = Object.keys(boardColors).length % colors.length;
      boardColors[boardName] = colors[index];
    }
    return boardColors[boardName];
  }

  // Fetch activities when card changes
  useEffect(() => {
    if (card) {
      // Reset states
      setSelectedMember(null);
      setSelectedActivityCard(null);
      setMemberActivities([]);
      setMembers([]);
      setActivityCardOptions([]);
      setAllLinkedCards([]);
      setActivities([]);
      setSelectedActivity(null);
      setDetailsData(null);
      setShowDetails(false);

      fetchCardActivities(card.trello_id);
    }
  }, [card]);

  // Automatically select the first activity card option when available
  useEffect(() => {
    if (activityCardOptions.length > 0 && !selectedActivityCard) {
      setSelectedActivityCard(activityCardOptions[0]);
    }
  }, [activityCardOptions]);

  // Debugging logs
  useEffect(() => {
    console.log('Extracted Members:', members);
  }, [members]);

  useEffect(() => {
    console.log('Member Activities:', memberActivities);
  }, [memberActivities]);

  useEffect(() => {
    console.log('Details Data updated:', detailsData);
  }, [detailsData]);

  // Toggle group expansion
  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Grouping functions
  const classifyTask = (type) => {
    return type;
  };

  // Fetch card activities and associated member activities
  const fetchCardActivities = async (cardId) => {
    try {
      // Reset relevant states
      setIsLoadingMembers(true);
      setIsLoadingActivities(true);
      setMembers([]);
      setMemberActivities([]);
      setActivityCardOptions([]);
      setSelectedActivityCard(null);
      setSelectedMember(null);
      setAllLinkedCards([]); // Reset before fetching
  
      // Step 1: Collect all linked card IDs
      const allCardIds = await collectLinkedCardIds(cardId);
      allCardIds.push(cardId); // Include the main card
      const uniqueCardIds = Array.from(new Set(allCardIds));
  
      // Step 2: Fetch card details for all unique card IDs
      const cardDetailsPromises = uniqueCardIds.map((id) => fetchCardName(id));
      const linkedCardsDetails = await Promise.all(cardDetailsPromises);
      setAllLinkedCards(linkedCardsDetails);
      setActivityCardOptions(linkedCardsDetails);
  
      // Step 3: Fetch activities for all cards concurrently
      const cardActivitiesPromises = uniqueCardIds.map((id) => fetchCardActivitiesForCard(id));
      const cardActivitiesArrays = await Promise.all(cardActivitiesPromises);
      const aggregatedCardActivities = cardActivitiesArrays.flat();
  
      // Step 4: Extract unique members from aggregated activities
      const allMembers = extractMembersFromActions(aggregatedCardActivities);
      setMembers(allMembers);
  
      // Step 5: Set aggregated activities to state
      setActivities(aggregatedCardActivities);
  
      setIsLoadingMembers(false);
      setIsLoadingActivities(false);
    } catch (error) {
      console.error('Error fetching card activities:', error);
      setIsLoadingMembers(false);
      setIsLoadingActivities(false);
    }
  };
  

  const fetchCardActivitiesForCard = async (cardId) => {
    try {
      const res = await fetch(`/api/trello-audit/card-activities?cardId=${cardId}`);
      const data = await res.json();
      return data.activities || [];
    } catch (error) {
      console.error(`Error fetching activities for card ${cardId}:`, error);
      return [];
    }
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

  // Render member activities based on grouping
  const renderMemberActivities = () => {
    let groupedActivities;

    if (groupBy === 'month') {
      groupedActivities = groupActivitiesByMonth(memberActivities);
    } else if (groupBy === 'type') {
      groupedActivities = groupActivitiesByType(memberActivities);
    }

    return Object.entries(groupedActivities).map(([group, activities]) => (
      <div key={group}>
        <h5 onClick={() => toggleGroup(group)} className={styles.groupHeader}>
          {group}
        </h5>
        {expandedGroups[group] &&
          activities.map((activity) => {
            const actionDescription = getActionDescription(activity);

            return (
              <div key={activity.id} className={styles.activityItem}>
                {/* Activity details */}
                <p>
                  <strong>{actionDescription || 'Performed an action.'}</strong> on{' '}
                  {new Date(activity.date).toLocaleString()}
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
                <p>Type: {activity.type}</p>
              </div>
            );
          })}
      </div>
    ));
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

  // Recursively collect linked card IDs
  const collectLinkedCardIds = async (cardId, processedCardIds = new Set()) => {
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
        const linkedCardId = await extractCardIdFromUrl(attachment.url);
        if (linkedCardId) {
          linkedCardIds.push(linkedCardId);

          const moreLinkedCardIds = await collectLinkedCardIds(linkedCardId, processedCardIds);
          linkedCardIds = linkedCardIds.concat(moreLinkedCardIds);
        }
      }

      return Array.from(new Set(linkedCardIds));
    } catch (error) {
      console.error('Error collecting linked card IDs:', error);
      return [];
    }
  };

  // Fetch member activities from attached cards
  const fetchAttachedCardsMembers = async (cardId) => {
    try {
      const res = await fetch(`/api/trello-audit/card-attachments?cardId=${cardId}`);
      const data = await res.json();
      const attachments = data.attachments;

      const attachedCardMembers = [];

      const cardAttachments = attachments.filter(
        (attachment) => attachment.url && attachment.url.includes('https://trello.com/c/')
      );

      for (const attachment of cardAttachments) {
        const attachedCardId = await extractCardIdFromUrl(attachment.url);
        if (attachedCardId) {
          const res = await fetch(`/api/trello-audit/card-activities?cardId=${attachedCardId}`);
          const data = await res.json();
          const members = extractMembersFromActions(data.activities);
          attachedCardMembers.push(...members);
        }
      }

      return attachedCardMembers;
    } catch (error) {
      console.error('Error fetching attached cards members:', error);
      return [];
    }
  };

  // Extract card ID from Trello URL
  const extractCardIdFromUrl = async (url) => {
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

  // Fetch card name and details
  const fetchCardName = async (cardId) => {
    try {
      const res = await fetch(`/api/trello-audit/get-card-details?cardId=${cardId}`);
      const data = await res.json();
      return {
        id: cardId,
        name: data.name,
        boardName: data.board.name,
        shortLink: data.shortLink,
      };
    } catch (error) {
      console.error(`Error fetching card details for card ${cardId}:`, error);
      return {
        id: cardId,
        name: 'Unknown',
        boardName: 'Unknown',
        shortLink: '',
      };
    }
  };

  // Remove duplicate members (if necessary)
  const removeDuplicateMembers = (members) => {
    const membersMap = {};
    members.forEach((member) => {
      if (!membersMap[member.id]) {
        membersMap[member.id] = member;
      }
    });
    return Object.values(membersMap);
  };

  // Process and aggregate activities
  const processActivities = async (actions) => {
    console.log('Processing activities:', actions);

    // Filter for list movement actions and card creation
    const relevantActions = actions.filter(
      (action) =>
        (action.type === 'updateCard' && action.data.listAfter) ||
        action.type === 'createCard'
    );

    // Map to get the list names and movement dates
    const processedActivities = relevantActions.map((action) => ({
      id: action.id,
      date: action.date,
      listBefore: action.data.listBefore ? action.data.listBefore.name : null,
      listAfter: action.data.listAfter ? action.data.listAfter.name : action.data.list.name,
      memberCreator: action.memberCreator ? action.memberCreator.fullName : null,
      data: {
        card: {
          shortLink: action.data.card ? action.data.card.shortLink : null,
          name: action.data.card ? action.data.card.name : null,
        },
      },
      type: action.type,
    }));

    // Include card creation at the beginning
    const createCardAction = actions.find((action) => action.type === 'createCard');
    if (createCardAction && !processedActivities.find((a) => a.id === createCardAction.id)) {
      processedActivities.unshift({
        id: createCardAction.id,
        date: createCardAction.date,
        listBefore: null,
        listAfter: createCardAction.data.list ? createCardAction.data.list.name : 'Unknown List',
        memberCreator: createCardAction.memberCreator ? createCardAction.memberCreator.fullName : null,
        data: {
          card: {
            shortLink: createCardAction.data.card ? createCardAction.data.card.shortLink : null,
            name: createCardAction.data.card ? createCardAction.data.card.name : null,
          },
        },
        type: createCardAction.type,
      });
    }

    // Ensure the current list is included
    const currentListName = await fetchCurrentListName(card.trello_id);
    if (
      processedActivities.length === 0 ||
      processedActivities[processedActivities.length - 1].listAfter !== currentListName
    ) {
      processedActivities.push({
        id: 'current',
        date: new Date().toISOString(),
        listBefore:
          processedActivities.length > 0
            ? processedActivities[processedActivities.length - 1].listAfter
            : null,
        listAfter: currentListName,
        memberCreator: null,
        data: {
          card: {
            shortLink: card.shortLink,
            name: card.name,
          },
        },
        type: 'current',
      });
    }

    setActivities(processedActivities);
  };

  // Fetch current list name
  const fetchCurrentListName = async (cardId) => {
    try {
      const res = await fetch(`/api/trello-audit/get-card-details?cardId=${cardId}`);
      const data = await res.json();
      console.log('Fetched card details:', data);

      if (data.list && data.list.name) {
        return data.list.name;
      } else {
        console.error('List information is missing in the card details:', data);
        return 'Unknown List';
      }
    } catch (error) {
      console.error('Error fetching current list name:', error);
      return 'Unknown List';
    }
  };

  // Handle activity click to show details
  const handleActivityClick = async (activity) => {
    setSelectedActivity(activity);
    await fetchStepDetails(activity);
    setShowDetails(true);
  };

  const handleMemberClick = async (member) => {
    setLoadingMemberId(member.id);
    setSelectedMember(member);
    setIsLoadingActivities(true);
  
    try {
      // Fetch member activities across all linked cards concurrently
      const memberActivitiesPromises = allLinkedCards.map((linkedCard) =>
        fetchMemberActivitiesForCard(member.id, linkedCard.id)
      );
      const memberActivitiesArrays = await Promise.all(memberActivitiesPromises);
      const aggregatedMemberActivities = memberActivitiesArrays.flat();
  
      setMemberActivities(aggregatedMemberActivities);
      setIsLoadingActivities(false);
    } catch (error) {
      console.error('Error handling member click:', error);
      setIsLoadingActivities(false);
    }
  
    setLoadingMemberId(null);
  };
  

  const fetchMemberActivitiesForCard = async (memberId, cardId) => {
    if (!memberId || !cardId) return [];
  
    try {
      const url = new URL(`/api/trello-audit/member-activities`, window.location.origin);
      url.searchParams.append('memberId', memberId);
      url.searchParams.append('cardId', cardId);
  
      const res = await fetch(url.toString());
      const data = await res.json();
  
      return data.activities || [];
    } catch (error) {
      console.error(`Error fetching member activities for member ${memberId} on card ${cardId}:`, error);
      return [];
    }
  };
  
  

  // Handle card filter click to display activities for a selected card
  const handleCardFilterClick = async (option) => {
    setSelectedActivityCard(option);
    setIsLoadingActivities(true);
    setMemberActivities([]);

    try {
      const url = new URL(`/api/trello-audit/member-activities`, window.location.origin);
      if (selectedMember) {
        url.searchParams.append('memberId', selectedMember.id);
      }
      url.searchParams.append('cardId', option.id);

      const res = await fetch(url.toString());
      const data = await res.json();

      setMemberActivities(data.activities || []);
      setIsLoadingActivities(false);
    } catch (error) {
      console.error('Error fetching member activities for selected card:', error);
      setIsLoadingActivities(false);
    }
  };

  // Fetch step details for a selected activity
  const fetchStepDetails = async (activity) => {
    try {
      const res = await fetch(
        `/api/trello-audit/list-actions?cardId=${card.trello_id}&listName=${encodeURIComponent(
          activity.listAfter
        )}&since=${activity.date}`
      );
      const data = await res.json();
      console.log('Fetched step details:', data);

      setDetailsData(data);
    } catch (error) {
      console.error('Error fetching step details:', error);
    }
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

  if (!card) {
    return (
      <div className={styles.timelineContainer}>
        <p>Select a card to view its timeline.</p>
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      {/* Members Container */}
      <div className={styles.membersContainer}>
        {isLoadingMembers ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading Members...</p>
          </div>
        ) : members.length > 0 ? (
          members.map((member) => {
            const userColor = getUserColor(member.id);
            const isActive = selectedMember && selectedMember.id === member.id;
            return (
              <div
                key={member.id}
                className={`${styles.memberIcon} ${isActive ? styles.activeMemberIcon : ''}`}
                title={member.fullName}
                onClick={() => handleMemberClick(member)}
                style={{ backgroundColor: userColor }}
              >
                {loadingMemberId === member.id ? (
                  <div className={styles.memberLoadingSpinner}></div>
                ) : (
                  member.initials
                )}
              </div>
            );
          })
        ) : (
          <p>No members found for this card.</p>
        )}
      </div>

      {/* Timeline */}
      <div className={styles.timelineWrapper} ref={timelineRef}>
        <div className={styles.timeline}>
          {activities.map((activity, index) => {
            const isActive = selectedActivity && selectedActivity.id === activity.id;
            const daysInList = calculateDaysInList(activity, activities[index + 1]);
            return (
              <div
                key={activity.id}
                className={`${styles.timelineItem} ${isActive ? styles.activeTimelineItem : ''}`}
                onClick={() => handleActivityClick(activity)}
              >
                <div className={styles.circle}></div>
                <div className={styles.stepName}>
                  {activity.listAfter}
                  <div className={styles.daysInList}>{daysInList} days</div>
                </div>
                {index < activities.length - 1 && <div className={styles.line}></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Activities and Card Filter */}
      <div className={styles.detailsContainer}>
        {showMemberDetails && (
          <div className={styles.memberActivitiesContainer}>
            {/* Card Filter on the left */}
            <div className={styles.cardFilterContainer}>
              <h4>
                Cards {selectedMember ? `for ${selectedMember.fullName}` : 'for All Members'}
              </h4>

              {isLoadingActivities && (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Loading Activities...</p>
                </div>
              )}

              {activityCardOptions.map((option) => {
                const boardColor = getBoardColor(option.boardName);
                const isActive = selectedActivityCard && selectedActivityCard.id === option.id;
                return (
                  <div
                    key={option.id}
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
              })}
            </div>

            {/* Activity Data on the right */}
            <div className={styles.activityDataContainer}>
              {/* Group By Dropdown */}
              <div className={styles.groupByContainer}>
                <label>Group By: </label>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="month">Month</option>
                  <option value="type">Activity Type</option>
                </select>
              </div>

              {/* Render Member Activities */}
              {renderMemberActivities()}
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && detailsData && (
        <div>
          <button onClick={handleHideDetails} className={styles.closeButton}>
            Hide Details
          </button>
          <h4>Details for {selectedActivity.listAfter}</h4>
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
