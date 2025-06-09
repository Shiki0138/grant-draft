-- Grant Draft用のテーブル（既存プロジェクトとの競合を避けるため、プレフィックス付き）

-- Enable pgvector extension (既に有効の場合はスキップされます)
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant用プロファイルテーブル
CREATE TABLE IF NOT EXISTS grant_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant用ドキュメントテーブル（ベクトル埋め込み付き）
CREATE TABLE IF NOT EXISTS grant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('guideline', 'case', 'application')),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant用ドラフトテーブル
CREATE TABLE IF NOT EXISTS grant_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  guideline_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS grant_documents_user_id_idx ON grant_documents(user_id);
CREATE INDEX IF NOT EXISTS grant_documents_embedding_idx ON grant_documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS grant_drafts_user_id_idx ON grant_drafts(user_id);

-- RLS有効化
ALTER TABLE grant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grant_profiles
DO $$ BEGIN
  CREATE POLICY "Users can view own grant profile" ON grant_profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own grant profile" ON grant_profiles
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own grant profile" ON grant_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for grant_documents
DO $$ BEGIN
  CREATE POLICY "Users can view own grant documents" ON grant_documents
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own grant documents" ON grant_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own grant documents" ON grant_documents
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own grant documents" ON grant_documents
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies for grant_drafts
DO $$ BEGIN
  CREATE POLICY "Users can view own grant drafts" ON grant_drafts
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own grant drafts" ON grant_drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own grant drafts" ON grant_drafts
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own grant drafts" ON grant_drafts
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ベクトル検索関数
CREATE OR REPLACE FUNCTION match_grant_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM grant_documents d
  WHERE 
    d.user_id = auth.uid() AND
    (filter->>'role' IS NULL OR d.role = ANY(ARRAY(SELECT jsonb_array_elements_text(filter->'role'))))
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Storage bucket作成（既存の場合はスキップ）
INSERT INTO storage.buckets (id, name, public)
SELECT 'grant_files', 'grant_files', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'grant_files');

-- Storage policies
DO $$ BEGIN
  CREATE POLICY "Users can upload own grant files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'grant_files' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own grant files" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'grant_files' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own grant files" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'grant_files' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;