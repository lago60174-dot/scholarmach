-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE scholarship_type AS ENUM ('full', 'partial', 'travel', 'research', 'merit', 'need_based');
CREATE TYPE education_level AS ENUM ('high_school', 'undergraduate', 'masters', 'phd', 'postdoc');
CREATE TYPE notification_type AS ENUM ('recommendation', 'deadline', 'partner_response', 'system');
CREATE TYPE product_category AS ENUM ('books', 'courses', 'software', 'supplies', 'services', 'other');

-- User roles table (separate from profiles for security)
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  age integer,
  origin_country text,
  target_country text,
  field_of_study text,
  education_level education_level,
  gpa numeric(3,2),
  preferred_language text DEFAULT 'en',
  scholarship_type scholarship_type,
  finance_type text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Scholarships table
CREATE TABLE bourses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  country text,
  target_countries text[],
  field_of_study text,
  education_level education_level,
  scholarship_type scholarship_type,
  deadline date,
  amount numeric(10,2),
  currency text DEFAULT 'USD',
  requirements text,
  application_link text,
  is_active boolean DEFAULT true,
  is_approved boolean DEFAULT false,
  language text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bourses ENABLE ROW LEVEL SECURITY;

-- AI Recommendations table
CREATE TABLE recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bourse_id uuid REFERENCES bourses(id) ON DELETE CASCADE NOT NULL,
  score numeric(3,2) NOT NULL,
  match_reasons jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, bourse_id)
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Partners table
CREATE TABLE partenaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  country text,
  logo_url text,
  website_url text,
  rating numeric(2,1),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partenaires ENABLE ROW LEVEL SECURITY;

-- Affiliate products table
CREATE TABLE produits_affiliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  image_url text,
  prix numeric(10,2),
  categorie product_category,
  source text,
  lien_affiliation text NOT NULL,
  note numeric(2,1),
  populaire boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE produits_affiliation ENABLE ROW LEVEL SECURITY;

-- Testimonials table
CREATE TABLE temoignages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL,
  scholarship_name text,
  country text,
  avatar_url text,
  is_approved boolean DEFAULT false,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE temoignages ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Messages/Chat table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_bot boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Contact form table
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Roles: Only admins can view/manage
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Profiles: Users can view own, admins can view all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Scholarships: Public read, admin write
CREATE POLICY "Anyone can view approved scholarships" ON bourses
  FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "Admins can manage scholarships" ON bourses
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Recommendations: Users see own
CREATE POLICY "Users can view own recommendations" ON recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage recommendations" ON recommendations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Partners: Public read, admin write
CREATE POLICY "Anyone can view active partners" ON partenaires
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage partners" ON partenaires
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Products: Public read, admin write
CREATE POLICY "Anyone can view products" ON produits_affiliation
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON produits_affiliation
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Testimonials: Public read approved, users submit own
CREATE POLICY "Anyone can view approved testimonials" ON temoignages
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert own testimonial" ON temoignages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage testimonials" ON temoignages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Notifications: Users see own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Messages: Users see own
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Contacts: Anyone can submit, admins can view
CREATE POLICY "Anyone can submit contact" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view contacts" ON contacts
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contacts" ON contacts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bourses_updated_at BEFORE UPDATE ON bourses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partenaires_updated_at BEFORE UPDATE ON partenaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Give first user admin role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();