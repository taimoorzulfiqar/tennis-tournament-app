# Set-Based Tennis Matches Update

## Overview
This update transforms the tennis tournament app from a simple score-based system to a proper set-based tennis scoring system. Now matches support multiple sets with individual set scores, and winners are determined based on sets won rather than total games.

## Database Changes

### New Table: `match_sets`
- Stores individual set scores for each match
- Columns: `id`, `match_id`, `set_number`, `player1_games`, `player2_games`, `created_at`
- Each match can have multiple sets (e.g., 3 sets for a best-of-3 match)

### New Functions and Triggers
- `determine_match_winner()`: Calculates winner based on sets won
- `update_match_winner()`: Trigger function that automatically updates winner when sets change
- `match_totals` view: Provides backward compatibility with total scores

## Frontend Changes

### Updated Components
1. **AddMatch.tsx**
   - Now shows multiple set score inputs based on `sets_per_match`
   - Dynamically adjusts number of set inputs when `sets_per_match` changes
   - Validates that completed matches have valid set scores

2. **EditMatchModal.tsx**
   - Updated to show and edit individual set scores
   - Supports editing existing set data
   - Validates set scores before completion

3. **CreateTournament.tsx**
   - Updated to support set-based match creation
   - Shows set score inputs for each match in tournament creation
   - Validates set scores for completed matches

4. **Matches.tsx**
   - Updated display to show individual set scores
   - Shows "Set 1: 6-4, Set 2: 7-5" format
   - Displays winner based on sets won

### API Changes
- `matchAPI.getMatches()`: Now returns matches with sets data
- `matchAPI.getMatch()`: Returns single match with sets
- `matchAPI.updateMatchSets()`: New function to update set scores
- `matchAPI.createMatch()`: Updated to work with set-based structure

## Winner Determination Logic

### Before (Score-based)
- Winner = Player with higher total score
- Simple addition of all games

### After (Set-based)
- Winner = Player who wins more sets
- Set winner = Player with more games in that set
- Example: Player 1 wins Set 1 (6-4), Player 2 wins Set 2 (7-5), Player 1 wins Set 3 (6-2)
- Result: Player 1 wins the match (2 sets to 1)

## Testing Instructions

### 1. Database Setup
Run the SQL script in your Supabase SQL Editor:
```sql
-- Run scripts/update-matches-for-sets.sql
```

### 2. Test Match Creation
1. Go to "Add Match" page
2. Select players and set format (e.g., 3 sets)
3. Enter scores for each set:
   - Set 1: Player 1: 6, Player 2: 4
   - Set 2: Player 1: 7, Player 2: 5
   - Set 3: Player 1: 6, Player 2: 2
4. Check "Mark as completed"
5. Submit - should show Player 1 as winner (2 sets to 1)

### 3. Test Tournament Creation
1. Go to "Create Tournament"
2. Add matches with set scores
3. Mark some as completed
4. Verify winners are calculated correctly

### 4. Test Match Editing
1. Go to "Matches" page
2. Edit a completed match
3. Change set scores
4. Verify winner updates automatically

## Key Features

### Dynamic Set Inputs
- Number of set inputs changes based on `sets_per_match`
- Default is 3 sets (best-of-3)
- Supports 1-5 sets

### Validation
- Completed matches must have at least one set with scores
- Each set must have valid scores (not both 0)
- Prevents submission of invalid data

### Automatic Winner Calculation
- Winner is calculated automatically when sets are updated
- Uses database triggers for real-time updates
- Handles ties appropriately (no winner if sets are tied)

### Backward Compatibility
- Existing matches still work
- `match_totals` view provides total scores for leaderboards
- API maintains compatibility with existing code

## Files Modified

### Database
- `scripts/update-matches-for-sets.sql` (new)

### Frontend
- `src/types/index.ts`
- `src/lib/api.ts`
- `src/pages/AddMatch.tsx`
- `src/pages/CreateTournament.tsx`
- `src/pages/Matches.tsx`
- `src/components/EditMatchModal.tsx`

## Benefits

1. **Realistic Tennis Scoring**: Now matches actual tennis rules
2. **Better User Experience**: Clear set-by-set scoring
3. **Accurate Winners**: Winners determined by sets won, not total games
4. **Flexible Format**: Supports different match formats (best-of-3, best-of-5, etc.)
5. **Data Integrity**: Proper validation and automatic winner calculation

## Migration Notes

- Existing matches will continue to work
- New matches will use the set-based system
- Leaderboard calculations may need adjustment for the new scoring system
- Consider migrating existing match data to set format if needed
