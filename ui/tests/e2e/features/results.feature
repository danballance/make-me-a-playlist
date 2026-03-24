Feature: Results
  As a user
  I want to see a curated playlist of YouTube videos
  So that I can discover content I wouldn't find through normal recommendations

  Background:
    Given I completed a conversation about "advanced vim motions"
    And I am on the results page

  Scenario: Viewing the results page header
    Then I should see the title "Make me a playlist" in the results header
    And I should see a topic tag displaying "Advanced vim motions"
    And I should see a "New playlist" button

  Scenario: Viewing the results summary
    Then I should see the heading "Your curated playlist"
    And I should see a subtitle indicating the number of videos found
    And I should see an overall rationale explaining the curation strategy

  Scenario: Viewing a video card
    Then each video card should display a thumbnail
    And each video card should display a title
    And each video card should display a channel name
    And each video card should display a rationale

  Scenario: Videos are ranked in order
    Then I should see 5 video cards
    And they should be numbered sequentially from 1 to 5

  Scenario: Starting a new playlist
    When I click "New playlist"
    Then I should be navigated to the topic input page
