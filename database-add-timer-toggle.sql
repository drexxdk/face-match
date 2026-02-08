-- Add enable_timer column to groups table
-- This allows groups to have countdown timer enabled or disabled by default

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS enable_timer BOOLEAN DEFAULT true;

-- Update existing groups to have timer enabled (backward compatibility)
UPDATE groups SET enable_timer = true WHERE enable_timer IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN groups.enable_timer IS 'Whether to show countdown timer during gameplay. Default is true for backward compatibility.';

-- Add enable_timer column to game_sessions table
-- This allows each game session to inherit the timer setting from the group

ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS enable_timer BOOLEAN DEFAULT true;

-- Update existing game sessions to have timer enabled (backward compatibility)
UPDATE game_sessions SET enable_timer = true WHERE enable_timer IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN game_sessions.enable_timer IS 'Whether countdown timer is enabled for this game session. Inherited from group settings.';
