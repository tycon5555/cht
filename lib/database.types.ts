export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string
          avatar_url: string | null
          status: string
          status_message: string | null
          status_emoji: string | null
          pronouns: string | null
          about: string | null
          phone_verified: boolean
          email_verified: boolean
          verification_method: string
          suspended: boolean
          banned: boolean
          role: string
          invisible_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          display_name: string
          avatar_url?: string | null
          status?: string
          status_message?: string | null
          status_emoji?: string | null
          pronouns?: string | null
          about?: string | null
          phone_verified?: boolean
          email_verified?: boolean
          verification_method?: string
          suspended?: boolean
          banned?: boolean
          role?: string
          invisible_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          status?: string
          status_message?: string | null
          status_emoji?: string | null
          pronouns?: string | null
          about?: string | null
          phone_verified?: boolean
          email_verified?: boolean
          verification_method?: string
          suspended?: boolean
          banned?: boolean
          role?: string
          invisible_mode?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          type: string
          name: string
          avatar_url: string | null
          creator_id: string
          archived: boolean
          hidden: boolean
          hidden_password: string | null
          closed: boolean
          disappearing_message_duration: string
          read_receipts_setting: string
          slow_mode_enabled: boolean
          media_restricted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          name: string
          avatar_url?: string | null
          creator_id: string
          archived?: boolean
          hidden?: boolean
          hidden_password?: string | null
          closed?: boolean
          disappearing_message_duration?: string
          read_receipts_setting?: string
          slow_mode_enabled?: boolean
          media_restricted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          name?: string
          avatar_url?: string | null
          creator_id?: string
          archived?: boolean
          hidden?: boolean
          hidden_password?: string | null
          closed?: boolean
          disappearing_message_duration?: string
          read_receipts_setting?: string
          slow_mode_enabled?: boolean
          media_restricted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string | null
          type: string
          image_url: string | null
          voice_duration: number | null
          sticker_url: string | null
          poll_id: string | null
          status: string
          visibility: string
          is_encrypted: boolean
          starred: boolean
          edited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content?: string | null
          type?: string
          image_url?: string | null
          voice_duration?: number | null
          sticker_url?: string | null
          poll_id?: string | null
          status?: string
          visibility?: string
          is_encrypted?: boolean
          starred?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string | null
          type?: string
          image_url?: string | null
          voice_duration?: number | null
          sticker_url?: string | null
          poll_id?: string | null
          status?: string
          visibility?: string
          is_encrypted?: boolean
          starred?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      video_calls: {
        Row: {
          id: string
          chat_id: string
          initiator_id: string
          call_type: string
          status: string
          started_at: string | null
          ended_at: string | null
          duration: number | null
          twilio_room_sid: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          initiator_id: string
          call_type: string
          status?: string
          started_at?: string | null
          ended_at?: string | null
          duration?: number | null
          twilio_room_sid?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          initiator_id?: string
          call_type?: string
          status?: string
          started_at?: string | null
          ended_at?: string | null
          duration?: number | null
          twilio_room_sid?: string | null
          created_at?: string
        }
      }
    }
  }
}
