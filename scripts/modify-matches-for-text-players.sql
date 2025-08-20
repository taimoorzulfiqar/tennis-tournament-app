-- Modify matches table to allow text-based player names
-- This allows for more flexible match creation without requiring user registration

-- Add new columns for text-based player names
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS player1_name TEXT,
ADD COLUMN IF NOT EXISTS player2_name TEXT;

-- Create a comment explaining the change
COMMENT ON COLUMN matches.player1_name IS 'Text-based player name (alternative to player1_id)';
COMMENT ON COLUMN matches.player2_name IS 'Text-based player name (alternative to player2_id)';

-- Make the existing player_id columns nullable since we now have text alternatives
ALTER TABLE matches 
ALTER COLUMN player1_id DROP NOT NULL,
ALTER COLUMN player2_id DROP NOT NULL;

-- Add a check constraint to ensure at least one of player1_id or player1_name is provided
ALTER TABLE matches 
ADD CONSTRAINT check_player1_identifier 
CHECK (player1_id IS NOT NULL OR player1_name IS NOT NULL);

-- Add a check constraint to ensure at least one of player2_id or player2_name is provided
ALTER TABLE matches 
ADD CONSTRAINT check_player2_identifier 
CHECK (player2_id IS NOT NULL OR player2_name IS NOT NULL);

-- Update the leaderboard function to handle text-based player names
CREATE OR REPLACE FUNCTION get_tournament_leaderboard(tournament_id UUID)
RETURNS TABLE (
    player_id UUID,
    player_name TEXT,
    games_won BIGINT,
    matches_played BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH player_stats AS (
        -- Handle registered players (with profiles)
        SELECT 
            p.id as player_id,
            p.full_name as player_name,
            COALESCE(SUM(
                CASE 
                    WHEN m.player1_id = p.id THEN m.player1_score
                    WHEN m.player2_id = p.id THEN m.player2_score
                    ELSE 0
                END
            ), 0) as games_won,
            COUNT(m.id) as matches_played
        FROM profiles p
        LEFT JOIN tournament_players tp ON p.id = tp.player_id
        LEFT JOIN matches m ON (
            (m.player1_id = p.id OR m.player2_id = p.id) 
            AND m.tournament_id = tp.tournament_id
            AND m.status = 'completed'
        )
        WHERE tp.tournament_id = get_tournament_leaderboard.tournament_id
        GROUP BY p.id, p.full_name
        
        UNION ALL
        
        -- Handle text-based players (without profiles)
        SELECT 
            NULL::UUID as player_id,
            player_name,
            COALESCE(SUM(
                CASE 
                    WHEN m.player1_name = player_name THEN m.player1_score
                    WHEN m.player2_name = player_name THEN m.player2_score
                    ELSE 0
                END
            ), 0) as games_won,
            COUNT(m.id) as matches_played
        FROM (
            SELECT DISTINCT player1_name as player_name FROM matches 
            WHERE tournament_id = get_tournament_leaderboard.tournament_id 
            AND player1_name IS NOT NULL
            UNION
            SELECT DISTINCT player2_name as player_name FROM matches 
            WHERE tournament_id = get_tournament_leaderboard.tournament_id 
            AND player2_name IS NOT NULL
        ) text_players
        LEFT JOIN matches m ON (
            (m.player1_name = text_players.player_name OR m.player2_name = text_players.player_name) 
            AND m.tournament_id = get_tournament_leaderboard.tournament_id
            AND m.status = 'completed'
        )
        GROUP BY text_players.player_name
    )
    SELECT 
        ps.player_id,
        ps.player_name,
        ps.games_won,
        ps.matches_played,
        ROW_NUMBER() OVER (ORDER BY ps.games_won DESC, ps.matches_played DESC) as rank
    FROM player_stats ps;
END;
$$ LANGUAGE plpgsql;
