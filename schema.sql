-- Create the necessary tables for @auth/pg-adapter

CREATE TABLE verification_token
(
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE accounts
(
  id SERIAL,
  user_id INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  oauth_token_secret VARCHAR(255),
  oauth_token VARCHAR(255),

  PRIMARY KEY (id)
);

CREATE TABLE sessions
(
  id SERIAL,
  session_token VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,

  PRIMARY KEY (id)
);

CREATE TABLE users
(
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  email_verified TIMESTAMPTZ,
  image TEXT,
  password TEXT, -- Add password column for Credentials provider

  PRIMARY KEY (id)
);

-- Add constraints and indexes

ALTER TABLE verification_token ADD PRIMARY KEY (identifier, token);

CREATE UNIQUE INDEX accounts_provider_provider_account_id_idx ON accounts(provider, provider_account_id);
ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade;

CREATE UNIQUE INDEX sessions_session_token_idx ON sessions(session_token);
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade;

CREATE UNIQUE INDEX users_email_idx ON users(email);
