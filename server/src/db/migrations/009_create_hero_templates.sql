-- Migration 009: Create hero_templates table
-- Single source of truth for all hero definitions (names, base stats, skills, class type)

CREATE TABLE hero_templates (
    id VARCHAR(50) PRIMARY KEY,  -- e.g. 'warrior_001'
    name VARCHAR(50) NOT NULL,
    class_type VARCHAR(20) NOT NULL,
    base_attack INTEGER NOT NULL,
    base_armor INTEGER NOT NULL,
    base_hp INTEGER NOT NULL,
    attack_skill_name VARCHAR(50) NOT NULL,
    attack_skill_description TEXT NOT NULL DEFAULT '',
    attack_skill_icon VARCHAR(100) NOT NULL DEFAULT '⚔️',
    skills JSONB NOT NULL DEFAULT '[]',  -- array of {name, description, icon, maxLevel}
    spine_asset_key VARCHAR(50),  -- maps to spine asset folder
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
