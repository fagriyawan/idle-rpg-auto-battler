# Requirements Document

## Introduction

This feature integrates persistent player data into the Idle RPG Auto-Battler. Currently, resources (gold, gems, energy) are hardcoded in the frontend and heroes are defined as static data. This feature introduces database-backed player assets (diamonds), hero ownership, and an in-game messaging/inbox system. New players receive a welcome message with 3000 diamonds and are automatically granted 4 starter heroes (Elise, Ray, Rika, Nami) upon account creation.

## Glossary

- **Player_Data_Service**: The backend service responsible for managing player assets, hero ownership, and messages in the PostgreSQL database.
- **Inbox_System**: The in-game messaging interface that allows players to receive system messages with optional item attachments.
- **Message**: A system-generated notification stored in the database, containing a title, body text, and optional reward attachment.
- **Reward_Attachment**: An item or currency amount attached to a message that a player can claim.
- **Diamond**: The premium currency in the game, displayed as 💎 (Gems) in the top-right resource bar.
- **Hero_Roster**: The collection of heroes owned by a player, stored in the database and displayed on the Heroes page.
- **Starter_Heroes**: The 4 default heroes (Elise, Ray, Rika, Nami) granted to every new player automatically.
- **Notification_Badge**: A red circular indicator displayed on the inbox icon showing the count of unread or unclaimed messages.
- **Player**: An authenticated user identified by their wallet address, stored in the `players` table.

## Requirements

### Requirement 1: Player Diamond Storage

**User Story:** As a player, I want my diamond balance to be stored in the database, so that my currency persists across sessions.

#### Acceptance Criteria

1. WHEN a new Player registers, THE Player_Data_Service SHALL create a diamond balance record with an initial value of 0 for that Player.
2. WHEN the client requests player resource data, THE Player_Data_Service SHALL return the current diamond balance as an integer value within the range of 0 to 999,999,999.
3. WHEN a Player claims a Reward_Attachment containing diamonds, THE Player_Data_Service SHALL validate that the attached amount is a positive integer (minimum 1) and increment the Player diamond balance by that amount.
4. THE Player_Data_Service SHALL persist the diamond balance in the PostgreSQL database associated with the Player record.
5. IF the diamond increment would cause the balance to exceed 999,999,999, THEN THE Player_Data_Service SHALL cap the balance at 999,999,999 and not discard the reward claim.
6. IF the database operation fails during a diamond balance update, THEN THE Player_Data_Service SHALL not apply the increment and SHALL return an error indicating the balance update failed.
7. IF a Reward_Attachment contains a diamond amount that is not a positive integer, THEN THE Player_Data_Service SHALL reject the claim and return an error indicating an invalid reward amount.

### Requirement 2: Welcome Message Generation

**User Story:** As a new player, I want to receive a welcome message with 3000 diamonds, so that I have starting currency to use in the game.

#### Acceptance Criteria

1. WHEN a new Player completes registration, THE Player_Data_Service SHALL create exactly one welcome Message with the title "Welcome to the game!", a body containing a greeting to the player, a read status of unread, a creation timestamp equal to the registration time, and a Reward_Attachment of 3000 diamonds.
2. IF the welcome Message creation fails during the registration transaction, THEN THE Player_Data_Service SHALL roll back the entire registration transaction so that neither the player record nor the message are persisted.
3. THE Player_Data_Service SHALL create the welcome Message within the same transaction as player registration to ensure data consistency.
4. IF a player record already exists for the registering wallet address, THEN THE Player_Data_Service SHALL not create an additional welcome Message.

### Requirement 3: Inbox User Interface

**User Story:** As a player, I want a Messages/Inbox menu in the game, so that I can view and interact with my messages.

#### Acceptance Criteria

1. THE Inbox_System SHALL display a message icon button on the Dashboard interface.
2. WHEN the Player taps the message icon, THE Inbox_System SHALL open an inbox panel displaying up to 50 messages for that Player, ordered by creation date with the newest messages appearing first.
3. THE Inbox_System SHALL display each Message with its title (truncated to 60 characters with ellipsis if longer), body text (truncated to 120 characters with ellipsis if longer), a visual read/unread indicator, and claim status.
4. WHEN the Player opens a Message that has unread status, THE Inbox_System SHALL mark that Message as read and update the visual indicator from unread to read.
5. IF the inbox panel fails to load messages from the Player_Data_Service, THEN THE Inbox_System SHALL display an error message indicating messages could not be loaded and provide a retry option.
6. WHEN the Player has zero messages, THE Inbox_System SHALL display an empty state message indicating no messages are available.
7. WHEN the Player taps outside the inbox panel or taps a close button, THE Inbox_System SHALL close the inbox panel and return to the Dashboard view.

### Requirement 4: Notification Badge

**User Story:** As a player, I want to see a notification indicator on the inbox icon, so that I know when I have unread or unclaimed messages.

#### Acceptance Criteria

1. WHILE the Player has one or more unread or unclaimed messages, THE Inbox_System SHALL display a Notification_Badge on the message icon.
2. THE Notification_Badge SHALL show the count of distinct messages that are either unread or have unclaimed Reward_Attachments, counting each message at most once, and SHALL display "99+" when the count exceeds 99.
3. WHEN the Player reads all messages and claims all Reward_Attachments, THE Inbox_System SHALL hide the Notification_Badge.
4. WHEN a new message is received while the Player is in any screen, THE Inbox_System SHALL update the Notification_Badge count within 5 seconds without requiring a manual refresh.

### Requirement 5: Reward Claiming

**User Story:** As a player, I want to claim rewards attached to messages, so that the items are added to my account.

#### Acceptance Criteria

1. WHEN a Message contains a Reward_Attachment that has not been claimed, THE Inbox_System SHALL display a "Claim" button on that Message.
2. WHEN the Player presses the "Claim" button, THE Inbox_System SHALL disable the "Claim" button and display a loading indicator until the claim operation completes or fails.
3. WHEN the Player presses the "Claim" button, THE Player_Data_Service SHALL add the reward quantity to the Player's balance for the specified reward type (diamonds, gold, or energy).
4. WHEN the Player successfully claims a Reward_Attachment, THE Player_Data_Service SHALL mark the Reward_Attachment as claimed and record the claim timestamp.
5. IF the Player attempts to claim an already-claimed Reward_Attachment, THEN THE Player_Data_Service SHALL reject the request and return an error indicating the reward was already claimed.
6. IF the claim operation fails due to a server or network error, THEN THE Inbox_System SHALL re-enable the "Claim" button and display an error message indicating the claim could not be processed.
7. WHEN a Reward_Attachment is successfully claimed, THE Inbox_System SHALL replace the "Claim" button with a "Claimed" label.

### Requirement 6: Starter Hero Assignment

**User Story:** As a new player, I want to automatically receive 4 starter heroes, so that I can begin playing immediately.

#### Acceptance Criteria

1. WHEN a new Player completes registration, THE Player_Data_Service SHALL assign exactly 4 Starter_Heroes (Elise, Ray, Rika, Nami) to the Player's Hero_Roster, each at level 1.
2. THE Player_Data_Service SHALL store hero ownership records in the PostgreSQL database linking each hero to the Player.
3. THE Player_Data_Service SHALL assign Starter_Heroes within the same transaction as player registration to ensure data consistency.
4. IF the Starter_Hero assignment transaction fails, THEN THE Player_Data_Service SHALL roll back the entire registration transaction, not create the player record, and return an error indicating registration could not be completed.
5. IF a Player already has Starter_Heroes in their Hero_Roster, THEN THE Player_Data_Service SHALL not assign duplicate heroes upon subsequent authentication.

### Requirement 7: Hero Roster Persistence

**User Story:** As a player, I want my hero collection to be stored in the database, so that my heroes persist across sessions.

#### Acceptance Criteria

1. THE Player_Data_Service SHALL store each hero ownership record with the Player wallet address and hero identifier.
2. WHEN the client requests the Player Hero_Roster, THE Player_Data_Service SHALL return a list of all heroes owned by that Player, including each hero's identifier.
3. IF the Player owns no heroes, THEN THE Player_Data_Service SHALL return an empty list with no error.
4. WHEN the Player navigates to the Heroes page, THE client SHALL display all owned heroes without requiring any claim action from the Player.
5. IF the database is unavailable when the hero roster is requested, THEN THE Player_Data_Service SHALL return an error indicating the roster could not be retrieved.

### Requirement 8: Player Resource API

**User Story:** As a player, I want the dashboard to display my actual resource balance from the database, so that I see accurate data.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Player_Data_Service SHALL provide an authenticated API endpoint that returns the Player diamond balance as a non-negative integer.
2. THE Dashboard SHALL display the diamond balance retrieved from the Player_Data_Service instead of a hardcoded value.
3. WHEN the Player claims a Reward_Attachment, THE Dashboard SHALL fetch the updated diamond balance from the Player_Data_Service and display the new total within 3 seconds of the claim action.
4. IF the Player_Data_Service fails to return the diamond balance, THEN THE Dashboard SHALL display a loading or error indicator in place of the balance and allow the player to retry.
5. IF the Reward_Attachment claim request fails, THEN THE Dashboard SHALL display an error message indicating the claim was unsuccessful and retain the previously displayed diamond balance.

### Requirement 9: Database Schema for Player Data

**User Story:** As a developer, I want proper database tables for player assets, hero ownership, and messages, so that all player data is reliably persisted.

#### Acceptance Criteria

1. THE Player_Data_Service SHALL store diamond balances in a dedicated database table linked to the Player by player UUID, with the balance stored as an integer value constrained between 0 and 999,999,999 inclusive, defaulting to 0 for new players.
2. THE Player_Data_Service SHALL store hero ownership in a dedicated database table linking player UUID to hero identifier (string, maximum 20 characters), enforcing a unique constraint on the player-hero pair to prevent duplicate ownership records.
3. THE Player_Data_Service SHALL store messages in a dedicated database table with fields for player UUID, title (maximum 100 characters), body (maximum 1000 characters), read status (boolean, default false), reward type (string, maximum 30 characters, nullable), reward amount (integer, 0 to 999,999,999, nullable), claim status (boolean, default false), created_at timestamp, and expires_at timestamp (nullable).
4. THE Player_Data_Service SHALL use foreign key constraints referencing the existing `players` table by player UUID on all player data tables to maintain referential integrity.
5. IF a hero ownership record is inserted with a player-hero pair that already exists, THEN THE Player_Data_Service SHALL reject the insert and return an error indicating duplicate ownership.
