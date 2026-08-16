-- Vision Academy - كود مختصر

-- الجداول
CREATE TABLE IF NOT EXISTS profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, full_name text, phone text, parent_phone text, grade text CHECK (grade IN ('first_secondary','second_secondary')), role text DEFAULT 'student' CHECK (role IN ('student','admin')), created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS courses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, grade text CHECK (grade IN ('first_secondary','second_secondary')), video_url text, order_index int DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS exams (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, grade text CHECK (grade IN ('first_secondary','second_secondary')), duration_minutes int DEFAULT 30, start_at timestamptz, end_at timestamptz, is_published boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS exam_questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), exam_id uuid REFERENCES exams(id) ON DELETE CASCADE, question_text text NOT NULL, type text CHECK (type IN ('mcq','true_false','short_answer')), options jsonb DEFAULT '[]', correct_answer text, points int DEFAULT 1, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS exam_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), exam_id uuid REFERENCES exams(id) ON DELETE CASCADE, student_id uuid REFERENCES profiles(id) ON DELETE CASCADE, answers jsonb DEFAULT '[]', score numeric, grade_released boolean DEFAULT false, submitted_at timestamptz DEFAULT now(), UNIQUE (exam_id, student_id));
CREATE TABLE IF NOT EXISTS bookings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES profiles(id) ON DELETE CASCADE, requested_datetime timestamptz, subject text DEFAULT 'Computer Science', status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')), notes text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS competitions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, grade text CHECK (grade IN ('first_secondary','second_secondary')), deadline timestamptz, details text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS contact_links (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), platform text NOT NULL, label text NOT NULL, value text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS user_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES profiles(id) ON DELETE CASCADE, full_name text, phone text, action text CHECK (action IN ('login','logout')), ip_address text, user_agent text, created_at timestamptz DEFAULT now());

-- RLS (تفعيل + سياسات)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY p1 ON profiles FOR SELECT USING (auth.uid()=id OR EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY p2 ON profiles FOR UPDATE USING (auth.uid()=id);
CREATE POLICY c1 ON courses FOR SELECT USING (true);
CREATE POLICY c2 ON courses FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY e1 ON exams FOR SELECT USING (true);
CREATE POLICY e2 ON exams FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY q1 ON exam_questions FOR SELECT USING (true);
CREATE POLICY q2 ON exam_questions FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY s1 ON exam_submissions FOR SELECT USING (auth.uid()=student_id OR EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY s2 ON exam_submissions FOR INSERT WITH CHECK (auth.uid()=student_id);
CREATE POLICY s3 ON exam_submissions FOR UPDATE USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY b1 ON bookings FOR SELECT USING (auth.uid()=student_id OR EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY b2 ON bookings FOR INSERT WITH CHECK (auth.uid()=student_id);
CREATE POLICY b3 ON bookings FOR UPDATE USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY co1 ON competitions FOR SELECT USING (true);
CREATE POLICY co2 ON competitions FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY ct1 ON contact_links FOR SELECT USING (true);
CREATE POLICY ct2 ON contact_links FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY l1 ON user_logs FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin'));
CREATE POLICY l2 ON user_logs FOR INSERT WITH CHECK (auth.uid()=user_id);

-- Trigger (إنشاء profile تلقائي عند التسجيل)
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$ BEGIN INSERT INTO profiles(id,full_name,role) VALUES(new.id,new.raw_user_meta_data->>'full_name','student'); RETURN new; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- بيانات تجريبية
INSERT INTO contact_links(platform,label,value) VALUES ('whatsapp','واتساب','01234567890'),('phone','تليفون','01234567890'),('facebook','فيسبوك','https://facebook.com/visionacademy'),('youtube','يوتيوب','https://youtube.com/visionacademy'),('telegram','تليجرام','https://t.me/visionacademy'),('instagram','إنستجرام','https://instagram.com/visionacademy') ON CONFLICT DO NOTHING;
INSERT INTO courses(title,description,grade,video_url,order_index) VALUES ('مقدمة في البرمجة','أساسيات البرمجة والخوارزميات','first_secondary','https://youtube.com/watch?v=demo1',1),('Python للمبتدئين','تعلم لغة Python من الصفر','first_secondary','https://youtube.com/watch?v=demo2',2),('البرمجة الكائنية OOP','مفاهيم OOP والتصميم الكائني','second_secondary','https://youtube.com/watch?v=demo3',1),('قواعد البيانات SQL','إدارة البيانات باستخدام SQL','second_secondary','https://youtube.com/watch?v=demo4',2) ON CONFLICT DO NOTHING;
INSERT INTO competitions(title,description,grade,deadline,details) VALUES ('تحدي البرمجة الأول','حل 5 مسائل برمجية في أقل وقت','first_secondary',NOW()+INTERVAL '7 days','المسابقة مفتوحة لجميع طلاب الصف الأول.'),('مشروع نهاية الفصل','بناء تطبيق بسيط باستخدام Python','second_secondary',NOW()+INTERVAL '14 days','قدم مشروعك قبل الموعد النهائي.') ON CONFLICT DO NOTHING;
