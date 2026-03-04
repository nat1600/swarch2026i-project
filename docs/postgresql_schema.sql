----------------------------------------------------------------------------------------
/*
Initial reference schema, see Alembic migrations in auth-service or core-service
for latest version; and whatever the gamification-service uses
*/
----------------------------------------------------------------------------------------

CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY ,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leaderboards (
    id SERIAL PRIMARY KEY ,
    start_date TIMESTAMPTZ NOT NULL UNIQUE,
    end_date TIMESTAMPTZ NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    native_language INT NOT NULL REFERENCES languages(id),
    learning_language INT NOT NULL REFERENCES languages(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    email TEXT NOT NULL UNIQUE,
    username text NOT NULL UNIQUE,
    timezone VARCHAR(255) NOT NULL,
    current_streak SMALLINT DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak SMALLINT DEFAULT 0 CHECK (longest_streak >= 0),
    accumulated_points INT DEFAULT 0 CHECK (accumulated_points >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    game_id INT NOT NULL REFERENCES games(id),
    score INT NOT NULL CHECK (score >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE phrases (
    id SERIAL PRIMARY KEY ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    source_language_id INT NOT NULL REFERENCES languages(id),
    target_language_id INT NOT NULL REFERENCES languages(id),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    pronunciation TEXT,
    last_reviewed_date TIMESTAMPTZ,
    next_review_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_data (
    id SERIAL PRIMARY KEY ,
    phrase_id INT NOT NULL REFERENCES phrases(id),
    repetition_number INT NOT NULL DEFAULT 0 CHECK (repetition_number >= 0),
    easiness_factor NUMERIC(5,4) NOT NULL DEFAULT 2.5 CHECK (
        1.3 <= easiness_factor AND easiness_factor <= 2.5
    ),
    inner_repetition_interval INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_sessions_phrase (
    id SERIAL PRIMARY KEY ,
    review_session_id INT NOT NULL REFERENCES review_sessions(id),
    phrase_id INT NOT NULL REFERENCES phrases(id),
    try_number SMALLINT NOT NULL CHECK (try_number >= 0),
    response_time INT NOT NULL CHECK (response_time >= 0),
    recall_rating INT NOT NULL CHECK (
        0 <= recall_rating AND recall_rating <= 5
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leaderboard_user (
    id SERIAL PRIMARY KEY ,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    leaderboard_id INT NOT NULL REFERENCES leaderboards(id),
    score INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, leaderboard_id)
);

CREATE INDEX idx_active_users ON users(id) WHERE active = TRUE;
CREATE INDEX idx_phrases_user_id ON phrases(user_id);
CREATE INDEX idx_review_sessions_user_id ON review_sessions(user_id);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
