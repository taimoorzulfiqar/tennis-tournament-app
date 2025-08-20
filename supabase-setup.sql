-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('master', 'admin', 'player')) DEFAULT 'player',
    verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add verification_status column if it doesn't exist (for existing databases)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE profiles ADD COLUMN verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved';
    END IF;
END $$;

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_players junction table
CREATE TABLE IF NOT EXISTS tournament_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    court TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    player1_score INTEGER DEFAULT 0 CHECK (player1_score >= 0),
    player2_score INTEGER DEFAULT 0 CHECK (player2_score >= 0),
    winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed')) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_player_id ON tournament_players(player_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_player1_id ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2_id ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
    -- Create trigger for profiles if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for tournaments if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tournaments_updated_at') THEN
        CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for matches if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_matches_updated_at') THEN
        CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function to get tournament leaderboard
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
    )
    SELECT 
        ps.player_id,
        ps.player_name,
        ps.games_won,
        ps.matches_played,
        ROW_NUMBER() OVER (ORDER BY ps.games_won DESC, ps.matches_played DESC) as rank
    FROM player_stats ps
    ORDER BY ps.games_won DESC, ps.matches_played DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles are viewable by everyone' AND tablename = 'profiles') THEN
        CREATE POLICY "Profiles are viewable by everyone" ON profiles
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update their own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master users can insert profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Master users can insert profiles" ON profiles
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'master'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master users can delete profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Master users can delete profiles" ON profiles
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'master'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master users can update verification status' AND tablename = 'profiles') THEN
        CREATE POLICY "Master users can update verification status" ON profiles
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'master'
                )
            );
    END IF;
END $$;

-- Tournaments RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Tournaments are viewable by everyone' AND tablename = 'tournaments') THEN
        CREATE POLICY "Tournaments are viewable by everyone" ON tournaments
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Approved admins and masters can create tournaments' AND tablename = 'tournaments') THEN
        CREATE POLICY "Approved admins and masters can create tournaments" ON tournaments
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'master') AND verification_status = 'approved'
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Tournament creators can update their tournaments' AND tablename = 'tournaments') THEN
        CREATE POLICY "Tournament creators can update their tournaments" ON tournaments
            FOR UPDATE USING (created_by = auth.uid());
    END IF;
END $$;

-- Tournament players RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Tournament players are viewable by everyone' AND tablename = 'tournament_players') THEN
        CREATE POLICY "Tournament players are viewable by everyone" ON tournament_players
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Approved admins and masters can manage tournament players' AND tablename = 'tournament_players') THEN
        CREATE POLICY "Approved admins and masters can manage tournament players" ON tournament_players
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'master') AND verification_status = 'approved'
                )
            );
    END IF;
END $$;

-- Matches RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Matches are viewable by everyone' AND tablename = 'matches') THEN
        CREATE POLICY "Matches are viewable by everyone" ON matches
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Approved admins and masters can manage matches' AND tablename = 'matches') THEN
        CREATE POLICY "Approved admins and masters can manage matches" ON matches
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'master') AND verification_status = 'approved'
                )
            );
    END IF;
END $$;

-- Insert master user (this should be done via Supabase Auth API in practice)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'taimoorzulfiqar97@gmail.com') THEN
        INSERT INTO profiles (id, email, full_name, role, verification_status) 
        VALUES (
            gen_random_uuid(), 
            'taimoorzulfiqar97@gmail.com', 
            'Taimoor Zulfiqar', 
            'master', 
            'approved'
        );
    END IF;
END $$;
