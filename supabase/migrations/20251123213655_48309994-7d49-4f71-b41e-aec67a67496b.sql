-- Enable RLS on bourse table
ALTER TABLE bourse ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active and validated scholarships
CREATE POLICY "Anyone can view active scholarships"
ON bourse
FOR SELECT
USING (est_active = true AND est_validee = true);

-- Only admins can insert scholarships
CREATE POLICY "Admins can insert scholarships"
ON bourse
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update scholarships
CREATE POLICY "Admins can update scholarships"
ON bourse
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete scholarships
CREATE POLICY "Admins can delete scholarships"
ON bourse
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));