Feature: Results
  As a user
  I want to see a curated playlist of YouTube videos
  So that I can discover content I wouldn't find through normal recommendations

  Background:
    Given I completed a conversation about "advanced vim motions"
    And the agent has finished searching YouTube
    And I am on the results page

  # --- Page Layout ---

  Scenario: Viewing the results page header
    Then I should see the title "Make me a playlist" in the header
    And I should see a topic tag displaying "Advanced vim motions"
    And I should see a "New playlist" button

  Scenario: Viewing the results summary
    Then I should see the heading "Your curated playlist"
    And I should see a subtitle indicating the number of videos found
    And I should see an overall rationale explaining the agent's curation strategy

  # --- Video Cards ---

  Scenario: Viewing a video card
    Then each video card should display:
      | field           | description                                    |
      | thumbnail       | a preview image for the video                  |
      | duration        | the video length as a timestamp overlay         |
      | rank            | a sequential number starting from 1             |
      | title           | the video title                                 |
      | channel name    | the YouTube channel that published the video    |
      | view count      | approximate number of views                     |
      | year            | the year the video was published                |
      | rationale       | a short explanation of why this video was picked |

  Scenario: Videos are ranked in order
    Then I should see 5 video cards
    And they should be numbered sequentially from 1 to 5

  Scenario: Rationale explains why each video is a hidden gem
    Then each video card should include a rationale section
    And each rationale should explain what makes the video noteworthy or hard to find

  # --- Starting Over ---

  Scenario: Starting a new playlist
    When I click the "New playlist" button
    Then I should be navigated to the topic input page
    And no previous conversation state should be retained

  # --- Edge Cases ---

  Scenario: Agent found fewer videos than expected
    Given the agent only found 3 relevant videos
    Then I should see 3 video cards
    And the subtitle should reflect the actual count

  Scenario: Video thumbnail fails to load
    Given a video's thumbnail image is unavailable
    Then the thumbnail area should show a neutral placeholder background
    And the rest of the card should still render correctly
