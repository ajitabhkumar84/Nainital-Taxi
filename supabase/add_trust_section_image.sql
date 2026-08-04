-- Adds an image field to the trust_section singleton so the "Why families
-- trust us" homepage photo is admin-editable instead of a static placeholder.

ALTER TABLE trust_section ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN trust_section.image_url IS 'Photo shown beside the Trust & Safety section on the homepage. Recommended 1000x1250 (4:5).';
