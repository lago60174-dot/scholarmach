-- Allow users to view all profiles for messaging
CREATE POLICY "Users can view all profiles for messaging"
ON profiles
FOR SELECT
USING (true);

-- Update profiles table to ensure avatars can be updated
-- (already has the policy for users to update their own profile)