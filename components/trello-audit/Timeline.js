// components/trello-audit/Timeline.js
import React, { useEffect, useState, useRef } from 'react';
import styles from './Timeline.module.css';

export default function TimelineComponent({ card }) {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [members, setMembers] = useState([]); // New state for members
  const timelineRef = useRef(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberActivities, setMemberActivities] = useState([]);
  const [memberActivitiesPage, setMemberActivitiesPage] = useState(0); // For pagination
  const [expandedMonths, setExpandedMonths] = useState({});
  const [hasMoreMemberActivities, setHasMoreMemberActivities] = useState(true);
  const [lastActivityDate, setLastActivityDate] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [activityCardFilter, setActivityCardFilter] = useState('All');
  const [activityCardOptions, setActivityCardOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActivityCard, setSelectedActivityCard] = useState(null);
  const [groupBy, setGroupBy] = useState('month');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);




const colors = ['#A9A9A9', '#708090', '#778899', '#B0C4DE', '#4682B4', '#5F9EA0'];
  const userColors = {};


  function getUserColor(userId) {
    if (!userColors[userId]) {
      const index = Object.keys(userColors).length % colors.length;
      userColors[userId] = colors[index];
    }
    return userColors[userId];
  }
  const boardColors = {};
  const boardColorIndex = 0;
  
  function getBoardColor(boardName) {
    if (!boardColors[boardName]) {
      const index = Object.keys(boardColors).length % colors.length;
      boardColors[boardName] = colors[index];
    }
    return boardColors[boardName];
  }
  

  useEffect(() => {
    if (card) {
      fetchCardActivities(card.trello_id);
    }
  }, [card]);

  useEffect(() => {
    console.log('Members updated:', members);
  }, [members]);
  
  useEffect(() => {
    console.log('Member Activities updated:', memberActivities);
  }, [memberActivities]);
  
  useEffect(() => {
    console.log('Details Data updated:', detailsData);
  }, [detailsData]);
  const toggleMonth = (month) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };
 
  

  const classifyTask = (type) => {
    // Implement classification logic based on the activity type
    const taskClassification = {
      commentCard: 'Comment',
      updateCard: 'Update',
      createCard: 'Creation',
      // Add more classifications as needed
    };
    return taskClassification[type] || 'Other';
  };
  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleLoadMoreActivities = async () => {
    await fetchMemberActivities(selectedMember.id, lastActivityDate);
  };

  const handleHideMemberDetails = () => {
    setShowMemberDetails(false);
    setSelectedMember(null);
    setMemberActivities([]);
    setExpandedMonths({});
  };

  
  

  const fetchCardActivities = async (cardId) => {
    try {
      setIsLoadingMembers(true); // Start loading
      setMembers([]); // Clear existing members
      const res = await fetch(`/api/trello-audit/card-activities?cardId=${cardId}`);
      const data = await res.json();
      processActivities(data.activities);
  
      // Fetch members from actions
      const cardMembers = extractMembersFromActions(data.activities);
  
      // Fetch attached cards and their members
      const attachedMembers = await fetchAttachedCardsMembers(cardId);
  
      // Combine and set unique members
      const allMembers = [...cardMembers, ...attachedMembers];
      const uniqueMembers = removeDuplicateMembers(allMembers);
      console.log('Unique Members:', uniqueMembers);

      setMembers(uniqueMembers);
      setIsLoadingMembers(false); // Loading complete
    } catch (error) {
      console.error('Error fetching card activities:', error);
      setIsLoadingMembers(false); // Ensure loading is stopped in case of error
    }
  };

  const fetchMemberActivities = async (memberId, cardIds) => {
    try {
      const url = new URL(`/api/trello-audit/get-member-actions`, window.location.origin);
      url.searchParams.append('memberId', memberId);
      url.searchParams.append('cardIds', cardIds.join(','));
  
      const res = await fetch(url.toString());
      const data = await res.json();

      console.log('Fetched member activities:', data.actions);

  
      // Set memberActivities to the array of actions
      setMemberActivities(data.actions);
      setShowMemberDetails(true);
    } catch (error) {
      console.error('Error fetching member activities:', error);
    }
  };
  
  
  


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
  


    const renderMemberActivities = () => {
        console.log('Rendering member activities:', memberActivities);

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
                      <strong>
                        {typeof actionDescription === 'string'
                          ? actionDescription
                          : actionDescription.description}
                      </strong>{' '}
                      on {new Date(activity.date).toLocaleString()}
                    </p>
                        {actionDescription.checkItem && (
                          <div className={styles.checklistItem}>
                            <input
                              type="checkbox"
                              checked={actionDescription.checkItem.state === 'complete'}
                              readOnly
                            />
                            <label>{actionDescription.checkItem.name}</label>
                          </div>
                        )}
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
                        <p>Type: {classifyTask(activity.type)}</p>
                      </div>
                    );
                  })}
            </div>
          ));
      };
      



  const extractMembersFromActions = (actions) => {
    const membersMap = {};
    actions.forEach((action) => {
      const member = action.memberCreator;
      if (member && !membersMap[member.id]) {
        membersMap[member.id] = member;
      }
    });
    return Object.values(membersMap);
  };

  const fetchAttachedCardsMembers = async (cardId) => {
    try {
      // Fetch attachments on the card
      const res = await fetch(`/api/trello-audit/card-attachments?cardId=${cardId}`);
      const data = await res.json();
      const attachments = data.attachments;

      const attachedCardMembers = [];

      // Filter attachments that are Trello card links
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
  const collectLinkedCardIds = async (cardId, processedCardIds = new Set()) => {
    if (processedCardIds.has(cardId)) {
      return [];
    }
  
    processedCardIds.add(cardId);
  
    let linkedCardIds = [];
  
    try {
      // Fetch attachments on the card
      const res = await fetch(`/api/trello-audit/card-attachments?cardId=${cardId}`);
      const data = await res.json();
      const attachments = data.attachments;
  
      // Filter attachments that are Trello card links
      const cardAttachments = attachments.filter(
        (attachment) => attachment.url && attachment.url.includes('https://trello.com/c/')
      );
  
      for (const attachment of cardAttachments) {
        const linkedCardId = await extractCardIdFromUrl(attachment.url);
        if (linkedCardId) {
          linkedCardIds.push(linkedCardId);
  
          // Recursively collect linked card IDs
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
  
  const getCardIdFromShortLink = async (shortLink) => {
    try {
      const res = await fetch(`/api/trello-audit/resolve-card-id?shortLink=${shortLink}`);
      const data = await res.json();
      return data.cardId;
    } catch (error) {
      console.error('Error resolving card ID from shortLink:', error);
      return null;
    }
  };
  
  

  const removeDuplicateMembers = (members) => {
    const membersMap = {};
    members.forEach((member) => {
      if (!membersMap[member.id]) {
        membersMap[member.id] = member;
      }
    });
    return Object.values(membersMap);
  };

  const processActivities = (actions) => {
    console.log('Processing activities:', actions);

    // Filter for list movement actions
    const listMovements = actions.filter(
      (action) => action.type === 'updateCard' && action.data.listAfter
    );

    // Map to get the list names and movement dates
    const activities = listMovements.map((action) => ({
      id: action.id,
      date: action.date,
      listBefore: action.data.listBefore.name,
      listAfter: action.data.listAfter.name,
      memberCreator: action.memberCreator.fullName,
    }));



    setActivities(activities);
  };

  const handleActivityClick = async (activity) => {
    setSelectedActivity(activity);
    await fetchStepDetails(activity);
    setShowDetails(true); // Ensure this is set
  };
  const handleMemberClick = async (member) => {
    // Collect all linked card IDs recursively
    const allCardIds = await collectLinkedCardIds(card.trello_id);
    // Include the selected card ID
    allCardIds.push(card.trello_id);
    const uniqueCardIds = Array.from(new Set(allCardIds));
  
    // Reset options and set selected member
    setActivityCardOptions([]);
    setSelectedMember(member);
    setSelectedActivityCard(null);
    setMemberActivities([]);
    setShowMemberDetails(true); // Add this line to display the member details
  
    // Fetch card names and update UI immediately
    for (const cardId of uniqueCardIds) {
        const cardOption = await fetchCardName(cardId);
        setActivityCardOptions((prevOptions) => [...prevOptions, cardOption]);
    }

    // Automatically select the first card and fetch activities
    if (uniqueCardIds.length > 0) {
        const firstCardOption = await fetchCardName(uniqueCardIds[0]);
        setSelectedActivityCard(firstCardOption);
        await handleCardFilterClick(firstCardOption);
    }
  };
  
  
    
  
  
  const fetchCardName = async (cardId) => {
    const res = await fetch(`/api/trello-audit/get-card-details?cardId=${cardId}`);
    const data = await res.json();
    return {
      id: cardId,
      name: data.name,
      boardName: data.board.name,
      shortLink: data.shortLink,
    };
  };
  
  
  

  const handleHideDetails = () => {
    setShowDetails(false);
    setDetailsData(null);
    setSelectedActivity(null);
  };
  const handleCardFilterClick = async (option) => {
    setSelectedActivityCard(option);
    setIsLoading(true);
    setMemberActivities([]);
  
    try {
      const url = new URL(`/api/trello-audit/get-member-actions`, window.location.origin);
      url.searchParams.append('memberId', selectedMember.id);
      url.searchParams.append('cardIds', option.id);
  
      const res = await fetch(url.toString());
      const data = await res.json();
  
      // Set memberActivities to the array of actions
      setMemberActivities(data.actions);
      setShowMemberDetails(true); // Ensure it's set here
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching member activities:', error);
      setIsLoading(false);
    }
  };
  
  
  



  const fetchStepDetails = async (activity) => {
    const res = await fetch(
      `/api/trello-audit/list-actions?cardId=${card.trello_id}&listName=${encodeURIComponent(
        activity.listAfter
      )}&since=${activity.date}`
    );
    const data = await res.json();
    console.log('Fetched step details:', data);

    setDetailsData(data);
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
                {member.initials}
              </div>
            );
          })
        ) : (
          <p>No members found for this card.</p>
        )}
      </div>

            {/* Existing timeline code */}
            <div className={styles.timelineWrapper} ref={timelineRef}>
                <div className={styles.timeline}>
                {activities.map((activity, index) => {
                    const isActive = selectedActivity && selectedActivity.id === activity.id;
                    return (
                        <div
                        key={activity.id}
                        className={`${styles.timelineItem} ${isActive ? styles.activeTimelineItem : ''}`}
                        onClick={() => handleActivityClick(activity)}
                        >
                        <div className={styles.circle}></div>
                        <div className={styles.stepName}>{activity.listAfter}</div>
                        {index < activities.length - 1 && <div className={styles.line}></div>}
                        </div>
                    );
                    })}
                </div>
            </div>

            <div className={styles.detailsContainer}>
  {showMemberDetails && selectedMember && (
    <div className={styles.memberActivitiesContainer}>
      {/* Card Filter on the left */}
      <div className={styles.cardFilterContainer}>
        <h4>Cards for {selectedMember.fullName}</h4>
        {activityCardOptions.map((option) => {
          const boardColor = getBoardColor(option.boardName);
          const isActive = selectedActivityCard && selectedActivityCard.id === option.id;
          return (
            <div
              key={option.id}
              className={`${styles.cardFilterItem} ${isActive ? styles.activeCardFilterItem : ''}`}
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
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading...</p>
          </div>
        )}

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



            {/* Add this block for rendering detailsData */}
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
                    <span
                        className={styles.authorIcon}
                        title={action.memberCreator.fullName}
                    >
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
    const { type, data } = action;
    if (type === 'commentCard') {
      return `Commented: "${data.text}"`;
    } else if (type === 'updateCard') {
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
      }
    } else if (type === 'addChecklistToCard') {
      return `Added checklist "${data.checklist.name}".`;
    } else if (type === 'removeChecklistFromCard') {
      return `Removed checklist "${data.checklist.name}".`;
    } else if (type === 'createCheckItem') {
      return {
        description: `Added checklist item "${data.checkItem.name}" to checklist "${data.checklist.name}".`,
        checkItem: data.checkItem,
        checklist: data.checklist,
      };
    } else if (type === 'updateCheckItemStateOnCard') {
      const state = data.checkItem.state === 'complete' ? 'completed' : 'incomplete';
      return {
        description: `Marked checklist item "${data.checkItem.name}" as ${state}.`,
        checkItem: data.checkItem,
        checklist: data.checklist,
      };
    } else if (type === 'deleteCheckItem') {
      return `Deleted checklist item "${data.checkItem.name}" from checklist "${data.checklist.name}".`;
    } else if (type === 'updateCheckItem') {
      return {
        description: `Updated checklist item "${data.checkItem.name}".`,
        checkItem: data.checkItem,
        checklist: data.checklist,
      };
    }
    // Handle other types as before
    return 'Performed an action.';
  }
  
  