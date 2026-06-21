-- sessions
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id    TEXT NOT NULL,
  title       TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own sessions" ON sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- clips
CREATE TABLE clips (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  start_time     FLOAT NOT NULL,
  end_time       FLOAT NOT NULL,
  label          TEXT,
  subtitle_text  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own clips" ON clips
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = clips.session_id
        AND sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = clips.session_id
        AND sessions.user_id = auth.uid()
    )
  );
