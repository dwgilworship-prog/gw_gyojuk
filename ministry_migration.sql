-- 1. 사역부서 역할 ENUM 생성
DO $$ BEGIN
    CREATE TYPE ministry_role AS ENUM ('admin', 'member', 'leader');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 사역부서 테이블 생성
CREATE TABLE IF NOT EXISTS ministries (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 사역부서-교사 연결 테이블
CREATE TABLE IF NOT EXISTS ministry_teachers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id VARCHAR(36) NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  teacher_id VARCHAR(36) NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  role ministry_role DEFAULT 'member',
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- 4. 사역부서-학생 연결 테이블
CREATE TABLE IF NOT EXISTS ministry_students (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id VARCHAR(36) NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role ministry_role DEFAULT 'member', 
  assigned_at TIMESTAMP DEFAULT NOW()
);
