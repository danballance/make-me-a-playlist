Feature: Conversation
  As a user
  I want to have a back-and-forth conversation with the playlist agent
  So that it can understand my preferences before searching YouTube

  Background:
    Given I submitted the topic "advanced vim motions"
    And I am on the conversation page

  # --- Layout & Navigation ---

  Scenario: Viewing the conversation page structure
    Then I should see a top bar with a back arrow and the topic "advanced vim motions"
    And I should see a chat area with at least one agent message
    And I should see a reply input with placeholder "Type your reply..."
    And I should see a send button

  Scenario: Navigating back to topic input
    When I click the back arrow in the top bar
    Then I should be navigated to the topic input page

  # --- Agent Messages ---

  Scenario: Receiving the opening agent message
    Then I should see an agent message labeled "Playlist Agent"
    And the message should reference my topic "advanced vim motions"
    And the message should ask a clarifying question about my preferences

  Scenario: Agent thinking indicator appears while waiting
    When the agent is processing a response
    Then I should see an animated thinking indicator
    And I should see the text "Agent is thinking..."

  Scenario: Agent thinking indicator disappears when response arrives
    Given the agent is processing a response
    When the agent finishes processing
    Then the thinking indicator should disappear
    And I should see a new agent message in the chat

  # --- User Replies ---

  Scenario: Sending a reply
    When I type "I'm mostly interested in the tiny.nvim suite of plugins" into the reply input
    And I click the send button
    Then my message should appear in the chat right-aligned
    And the reply input should be cleared
    And the agent should begin processing a response

  Scenario: Sending a reply with the Enter key
    When I type "Especially mini.ai and mini.surround" into the reply input
    And I press the Enter key
    Then my message should appear in the chat right-aligned

  Scenario: Attempting to send an empty reply
    When I leave the reply input empty
    And I click the send button
    Then no message should be added to the chat

  # --- Conversation Flow ---

  Scenario: Multi-turn clarification before results
    Given the agent has asked about plugin scope preference
    When I reply "Mostly tiny.nvim plugins — especially mini.ai and mini.surround"
    Then the agent should ask a follow-up question to further refine my preferences
    And the conversation should continue until the agent has enough context

  Scenario: Agent decides it has enough context
    Given the agent has gathered sufficient preference information
    When the agent finishes its final clarifying exchange
    Then I should be navigated to the results page

  # --- Scroll Behavior ---

  Scenario: Chat auto-scrolls to newest message
    Given the conversation has more messages than fit on screen
    When a new message appears in the chat
    Then the chat area should scroll to show the newest message
