-- Add table to track import pagination state
CREATE TABLE IF NOT EXISTS import_pagination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  import_type TEXT NOT NULL DEFAULT 'twitter_bookmarks',
  next_token TEXT,
  last_imported_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, import_type)
);

-- Enable RLS
ALTER TABLE import_pagination ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own import pagination" 
ON import_pagination 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_import_pagination_updated_at
BEFORE UPDATE ON import_pagination
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();