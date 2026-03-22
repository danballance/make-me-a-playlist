Feature: Topic Input
  As a user
  I want to describe a topic or theme
  So that the AI agent can search YouTube for hidden gems matching my interest

  Background:
    Given I am on the topic input page

  Scenario: Viewing the landing page
    Then I should see the heading "Make me a playlist"
    And I should see a description mentioning "YouTube" and "hidden gems"
    And I should see a text input with placeholder "advanced vim motions"
    And I should see a "Find my playlist" button

  Scenario: Submitting a valid topic
    When I type "advanced vim motions" into the topic input
    And I click "Find my playlist"
    Then I should be navigated to the conversation page

  Scenario: Submitting an empty topic
    When I leave the topic input empty
    And I click "Find my playlist"
    Then I should see a validation message asking me to enter a topic
    And I should remain on the topic input page

  Scenario Outline: Submitting various topic formats
    When I type "<topic>" into the topic input
    And I click "Find my playlist"
    Then I should be navigated to the conversation page

    Examples:
      | topic                                  |
      | advanced vim motions                   |
      | how container orchestration works      |
      | beginner woodworking joints            |
      | the history of mechanical keyboards    |
