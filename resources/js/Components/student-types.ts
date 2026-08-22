export interface Student {
    id: number
    name: string
    email: string
    avatar_path: string | null
    timezone: string
    locale: string
}

export interface DashboardStats {
    courses: {
        total: number
        active: number
        completed: number
    }
    progress: {
        percentage: number
        completed_lessons: number
        tracked_lessons: number
    }
    points: {
        total: number
    }
    streak: {
        current: number
        longest: number
        last_activity_on: string | null
    }
}

export interface WeeklyDay {
    date: string
    label: string
    activities: number
    points: number
}

export interface WeeklyProgress {
    days: WeeklyDay[]
    total_activities: number
    total_points: number
}

export interface CourseItem {
    id: number
    title: string
    slug: string
    thumbnail_path: string | null
    level: string
    category: string | null
    progress: number
    completed_lessons: number
    total_lessons: number
    enrolled_at: string | null
    access_granted?: boolean
    access_level?: 'free' | 'full' | 'preview'
    short_description?: string | null
    access_type?: string
    price?: string | number
    currency?: string
}

export interface WorkItem {
    id: number
    title: string
    course: string | null
    due_at: string | null
    max_points?: number
    status?: string
    time_limit_minutes?: number | null
    passing_score?: number
    max_attempts?: number | null
}

export interface ActivityItem {
    id: number
    type: string
    points: number
    occurred_at: string | null
    course: string | null
    lesson: string | null
    assignment: string | null
    quiz: string | null
}

export interface AchievementItem {
    id: number
    name: string
    description: string
    icon: string | null
    points: number
    earned_at: string | null
}

export interface LeaderboardStudent {
    rank: number
    user_id: number
    name: string | null
    avatar_path: string | null
    points: number
}

export interface Leaderboard {
    rank: number
    total_points: number
    top_students: LeaderboardStudent[]
}

export type IconName =
    | 'grid' | 'book' | 'assignment' | 'quiz' | 'trophy' | 'chart'
    | 'shield' | 'user' | 'search' | 'sun' | 'moon' | 'menu' | 'x'
    | 'chevron' | 'calendar' | 'clock' | 'sparkles' | 'flame' | 'arrow'
    | 'logout' | 'support' | 'chatbot' | 'check' | 'target' | 'play' | 'more' | 'upload'
    | 'copy' | 'share' | 'trash' | 'refresh' | 'edit'

export interface SearchResult {
    type: 'Course' | 'Assignment' | 'Quiz'
    title: string
    subtitle: string
    href: string
}


export interface PageProps {
    [key: string]: unknown
    student: Student
    stats: DashboardStats
    weekly_progress?: WeeklyProgress
    current_courses?: CourseItem[]
    upcoming_assignments?: WorkItem[]
    upcoming_quizzes?: WorkItem[]
    recent_activity?: ActivityItem[]
    achievements?: AchievementItem[]
    recommendations?: CourseItem[]
    leaderboard?: Leaderboard
}
