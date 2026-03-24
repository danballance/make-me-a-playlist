Feature: Conversation
  As a user
  I want to have a back-and-forth conversation with the playlist agent
  So that it can understand my preferences before searching YouTube

  Background:
    Given I submitted the topic "advanced vim motions"
    And I am on the conversation page

  Scenario: Viewing the conversation page structure
    Then I should see a top bar with a back arrow and the topic "advanced vim motions"
    And I should see a chat area with at least one agent message
    And I should see a reply input with placeholder "Type your reply..."
    And I should see a send button

  Scenario: Navigating back to topic input
    When I click the back arrow in the top bar
    Then I should be navigated to the topic input page

  Scenario: Receiving the opening agent message
    Then I should see an agent message labeled "Playlist Agent"
    And the agent message should reference my topic "advanced vim motions"

  Scenario: Sending a reply
    When I type "I'm mostly interested in the tiny.nvim suite of plugins" into the reply input
    And I click the send button
    Then my message should appear in the chat right-aligned
    And the reply input should be cleared

  Scenario: Sending a reply with the Enter key
    When I type "Especially mini.ai and mini.surround" into the reply input
    And I press the Enter key in the reply input
    Then my message should appear in the chat right-aligned

  Scenario: Attempting to send an empty reply
    When I leave the reply input empty
    And I click the send button
    Then no new message should be added to the chat
