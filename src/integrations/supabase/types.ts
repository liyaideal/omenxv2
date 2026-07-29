export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      airdrop_positions: {
        Row: {
          activated_at: string | null
          activated_trade_id: string | null
          airdrop_value: number
          close_reason: string | null
          connected_account_id: string | null
          counter_event_name: string
          counter_option_label: string
          counter_price: number
          counter_side: string
          created_at: string
          exit_price: number | null
          expired_at: string | null
          expires_at: string
          external_event_name: string | null
          external_position_id: string | null
          external_price: number | null
          external_side: string | null
          external_size: number | null
          id: string
          redeemable_cap: number | null
          settled_at: string | null
          settled_pnl: number | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_trade_id?: string | null
          airdrop_value?: number
          close_reason?: string | null
          connected_account_id?: string | null
          counter_event_name: string
          counter_option_label: string
          counter_price: number
          counter_side: string
          created_at?: string
          exit_price?: number | null
          expired_at?: string | null
          expires_at: string
          external_event_name?: string | null
          external_position_id?: string | null
          external_price?: number | null
          external_side?: string | null
          external_size?: number | null
          id?: string
          redeemable_cap?: number | null
          settled_at?: string | null
          settled_pnl?: number | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_trade_id?: string | null
          airdrop_value?: number
          close_reason?: string | null
          connected_account_id?: string | null
          counter_event_name?: string
          counter_option_label?: string
          counter_price?: number
          counter_side?: string
          created_at?: string
          exit_price?: number | null
          expired_at?: string | null
          expires_at?: string
          external_event_name?: string | null
          external_position_id?: string | null
          external_price?: number | null
          external_side?: string | null
          external_size?: number | null
          id?: string
          redeemable_cap?: number | null
          settled_at?: string | null
          settled_pnl?: number | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "airdrop_positions_activated_trade_id_fkey"
            columns: ["activated_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "airdrop_positions_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          ip_whitelist: string[]
          key_prefix: string
          label: string
          last_used_at: string | null
          revoked_at: string | null
          scopes: string[]
          status: string
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_whitelist?: string[]
          key_prefix: string
          label: string
          last_used_at?: string | null
          revoked_at?: string | null
          scopes?: string[]
          status?: string
          tier?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_whitelist?: string[]
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
          scopes?: string[]
          status?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      asset_verifications: {
        Row: {
          balance: number
          batch_id: string
          created_at: string
          id: string
          leaf_hash: string
          positions_value: number
          proof_path: Json
          state_root: string
          total_equity: number
          updated_at: string
          user_id: string
          verification_result: string
          verified_at: string | null
        }
        Insert: {
          balance?: number
          batch_id: string
          created_at?: string
          id?: string
          leaf_hash: string
          positions_value?: number
          proof_path?: Json
          state_root: string
          total_equity?: number
          updated_at?: string
          user_id: string
          verification_result?: string
          verified_at?: string | null
        }
        Update: {
          balance?: number
          batch_id?: string
          created_at?: string
          id?: string
          leaf_hash?: string
          positions_value?: number
          proof_path?: Json
          state_root?: string
          total_equity?: number
          updated_at?: string
          user_id?: string
          verification_result?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      budget_limits: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          id: string
          is_active: boolean | null
          limit_amount: number
          period_end: string
          period_start: string
          type: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_amount?: number
          id?: string
          is_active?: boolean | null
          limit_amount: number
          period_end: string
          period_start: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          id?: string
          is_active?: boolean | null
          limit_amount?: number
          period_end?: string
          period_start?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      category_boost_configs: {
        Row: {
          category: string
          enabled: boolean
          max_leverage: number
          updated_at: string
        }
        Insert: {
          category: string
          enabled?: boolean
          max_leverage?: number
          updated_at?: string
        }
        Update: {
          category?: string
          enabled?: boolean
          max_leverage?: number
          updated_at?: string
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          created_at: string
          disconnected_at: string | null
          display_address: string
          id: string
          platform: string
          signature: string
          signed_message: Json
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string
          disconnected_at?: string | null
          display_address: string
          id?: string
          platform?: string
          signature: string
          signed_message: Json
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string
          disconnected_at?: string | null
          display_address?: string
          id?: string
          platform?: string
          signature?: string
          signed_message?: Json
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      deposit_addresses: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          network: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean
          network: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          network?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_mappings: {
        Row: {
          category: string | null
          created_at: string
          external_event_id: string
          external_event_name: string
          external_platform: string
          id: string
          mapping_status: string
          omenx_event_id: string | null
          omenx_event_name: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          external_event_id: string
          external_event_name: string
          external_platform?: string
          id?: string
          mapping_status?: string
          omenx_event_id?: string | null
          omenx_event_name?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          external_event_id?: string
          external_event_name?: string
          external_platform?: string
          id?: string
          mapping_status?: string
          omenx_event_id?: string | null
          omenx_event_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_options: {
        Row: {
          created_at: string
          event_id: string
          final_price: number | null
          funding_rate: number
          id: string
          is_winner: boolean | null
          label: string
          next_funding_at: string | null
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          final_price?: number | null
          funding_rate?: number
          id: string
          is_winner?: boolean | null
          label: string
          next_funding_at?: string | null
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          final_price?: number | null
          funding_rate?: number
          id?: string
          is_winner?: boolean | null
          label?: string
          next_funding_at?: string | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_options_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_relations: {
        Row: {
          created_at: string
          display_order: number
          id: string
          related_event_id: string
          source_event_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          related_event_id: string
          source_event_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          related_event_id?: string
          source_event_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          base_price: number | null
          category: string
          created_at: string
          description: string | null
          end_date: string | null
          event_subtype: string | null
          expected_settlement_time: string | null
          external_links: Json | null
          freeze_time: string | null
          icon: string
          id: string
          image_url: string | null
          is_resolved: boolean
          lifecycle_status: string | null
          name: string
          price_label: string | null
          product_lines: string[]
          rules: string | null
          settled_at: string | null
          settlement_description: string | null
          side_labels: Json | null
          source_name: string | null
          source_url: string | null
          start_date: string | null
          updated_at: string
          volume: string | null
          winning_option_id: string | null
        }
        Insert: {
          base_price?: number | null
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_subtype?: string | null
          expected_settlement_time?: string | null
          external_links?: Json | null
          freeze_time?: string | null
          icon?: string
          id: string
          image_url?: string | null
          is_resolved?: boolean
          lifecycle_status?: string | null
          name: string
          price_label?: string | null
          product_lines?: string[]
          rules?: string | null
          settled_at?: string | null
          settlement_description?: string | null
          side_labels?: Json | null
          source_name?: string | null
          source_url?: string | null
          start_date?: string | null
          updated_at?: string
          volume?: string | null
          winning_option_id?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_subtype?: string | null
          expected_settlement_time?: string | null
          external_links?: Json | null
          freeze_time?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_resolved?: boolean
          lifecycle_status?: string | null
          name?: string
          price_label?: string | null
          product_lines?: string[]
          rules?: string | null
          settled_at?: string | null
          settlement_description?: string | null
          side_labels?: Json | null
          source_name?: string | null
          source_url?: string | null
          start_date?: string | null
          updated_at?: string
          volume?: string | null
          winning_option_id?: string | null
        }
        Relationships: []
      }
      h2e_fund: {
        Row: {
          active_airdrops_count: number
          active_airdrops_value: number
          created_at: string
          id: string
          total_allocated: number
          total_disbursed: number
          total_returned: number
          updated_at: string
        }
        Insert: {
          active_airdrops_count?: number
          active_airdrops_value?: number
          created_at?: string
          id?: string
          total_allocated?: number
          total_disbursed?: number
          total_returned?: number
          updated_at?: string
        }
        Update: {
          active_airdrops_count?: number
          active_airdrops_value?: number
          created_at?: string
          id?: string
          total_allocated?: number
          total_disbursed?: number
          total_returned?: number
          updated_at?: string
        }
        Relationships: []
      }
      market_activity: {
        Row: {
          amount: number | null
          boost: number | null
          created_at: string
          event_name: string | null
          id: string
          option_label: string | null
        }
        Insert: {
          amount?: number | null
          boost?: number | null
          created_at?: string
          event_name?: string | null
          id?: string
          option_label?: string | null
        }
        Update: {
          amount?: number | null
          boost?: number | null
          created_at?: string
          event_name?: string | null
          id?: string
          option_label?: string | null
        }
        Relationships: []
      }
      points_accounts: {
        Row: {
          balance: number
          created_at: string
          frozen: number
          id: string
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          frozen?: number
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          frozen?: number
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          source: string
          source_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          source: string
          source_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          source_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      points_redemptions: {
        Row: {
          created_at: string
          exchange_rate: Json
          id: string
          points_spent: number
          status: string
          trial_balance_received: number
          user_id: string
        }
        Insert: {
          created_at?: string
          exchange_rate: Json
          id?: string
          points_spent: number
          status?: string
          trial_balance_received: number
          user_id: string
        }
        Update: {
          created_at?: string
          exchange_rate?: Json
          id?: string
          points_spent?: number
          status?: string
          trial_balance_received?: number
          user_id?: string
        }
        Relationships: []
      }
      position_funding_ledger: {
        Row: {
          accrual_end: string
          accrual_start: string
          amount: number
          applied_rate: number
          created_at: string
          event_name: string
          id: string
          notional: number
          option_id: string | null
          position_id: string
          user_id: string
        }
        Insert: {
          accrual_end: string
          accrual_start: string
          amount: number
          applied_rate: number
          created_at?: string
          event_name: string
          id?: string
          notional: number
          option_id?: string | null
          position_id: string
          user_id: string
        }
        Update: {
          accrual_end?: string
          accrual_start?: string
          amount?: number
          applied_rate?: number
          created_at?: string
          event_name?: string
          id?: string
          notional?: number
          option_id?: string | null
          position_id?: string
          user_id?: string
        }
        Relationships: []
      }
      position_vouchers: {
        Row: {
          claimed_at: string | null
          code: string
          created_at: string
          entry_price_max: number
          entry_price_min: number
          expires_at: string
          face_value: number
          id: string
          issued_at: string
          max_holding_hours: number
          min_hours_to_settlement: number
          redeemable_cap_pct: number
          redeemed_airdrop_position_id: string | null
          redeemed_at: string | null
          redeemed_event_id: string | null
          redeemed_option_id: string | null
          redeemed_side: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          code: string
          created_at?: string
          entry_price_max?: number
          entry_price_min?: number
          expires_at: string
          face_value: number
          id?: string
          issued_at?: string
          max_holding_hours?: number
          min_hours_to_settlement?: number
          redeemable_cap_pct?: number
          redeemed_airdrop_position_id?: string | null
          redeemed_at?: string | null
          redeemed_event_id?: string | null
          redeemed_option_id?: string | null
          redeemed_side?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          code?: string
          created_at?: string
          entry_price_max?: number
          entry_price_min?: number
          expires_at?: string
          face_value?: number
          id?: string
          issued_at?: string
          max_holding_hours?: number
          min_hours_to_settlement?: number
          redeemable_cap_pct?: number
          redeemed_airdrop_position_id?: string | null
          redeemed_at?: string | null
          redeemed_event_id?: string | null
          redeemed_option_id?: string | null
          redeemed_side?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_vouchers_redeemed_airdrop_position_id_fkey"
            columns: ["redeemed_airdrop_position_id"]
            isOneToOne: false
            referencedRelation: "airdrop_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          closed_at: string | null
          created_at: string
          entry_price: number
          event_name: string
          funding_accrued: number
          id: string
          last_funding_at: string | null
          leverage: number
          margin: number
          mark_price: number
          option_id: string | null
          option_label: string
          pnl: number | null
          pnl_percent: number | null
          product_line: string
          side: string
          size: number
          sl_mode: string | null
          sl_value: number | null
          status: string
          tp_mode: string | null
          tp_value: number | null
          trade_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          entry_price: number
          event_name: string
          funding_accrued?: number
          id?: string
          last_funding_at?: string | null
          leverage?: number
          margin: number
          mark_price: number
          option_id?: string | null
          option_label: string
          pnl?: number | null
          pnl_percent?: number | null
          product_line?: string
          side: string
          size: number
          sl_mode?: string | null
          sl_value?: number | null
          status?: string
          tp_mode?: string | null
          tp_value?: number | null
          trade_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          event_name?: string
          funding_accrued?: number
          id?: string
          last_funding_at?: string | null
          leverage?: number
          margin?: number
          mark_price?: number
          option_id?: string | null
          option_label?: string
          pnl?: number | null
          pnl_percent?: number | null
          product_line?: string
          side?: string
          size?: number
          sl_mode?: string | null
          sl_value?: number | null
          status?: string
          tp_mode?: string | null
          tp_value?: number | null
          trade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "event_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          created_at: string
          event_id: string
          id: string
          option_id: string
          price: number
          recorded_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          option_id: string
          price: number
          recorded_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          option_id?: string
          price?: number
          recorded_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_method: string | null
          avatar_url: string | null
          balance: number | null
          created_at: string
          email: string | null
          id: string
          preferred_surface: string
          spot_balance: number
          totp_enabled: boolean
          trial_balance: number | null
          updated_at: string
          user_id: string
          username: string | null
          withdraw_2fa_mode: string
        }
        Insert: {
          auth_method?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string
          email?: string | null
          id?: string
          preferred_surface?: string
          spot_balance?: number
          totp_enabled?: boolean
          trial_balance?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          withdraw_2fa_mode?: string
        }
        Update: {
          auth_method?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string
          email?: string | null
          id?: string
          preferred_surface?: string
          spot_balance?: number
          totp_enabled?: boolean
          trial_balance?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          withdraw_2fa_mode?: string
        }
        Relationships: []
      }
      recovery_requests: {
        Row: {
          accepted_at: string | null
          admin_note: string | null
          claimed_amount: number
          completed_at: string | null
          created_at: string
          estimated_return: number | null
          fee_percent: number
          id: string
          processed_tx_hash: string | null
          quoted_at: string | null
          sender_address: string
          status: string
          tx_hash: string
          updated_at: string
          user_id: string
          user_note: string | null
          wrong_network: string
          wrong_token: string
        }
        Insert: {
          accepted_at?: string | null
          admin_note?: string | null
          claimed_amount: number
          completed_at?: string | null
          created_at?: string
          estimated_return?: number | null
          fee_percent?: number
          id?: string
          processed_tx_hash?: string | null
          quoted_at?: string | null
          sender_address: string
          status?: string
          tx_hash: string
          updated_at?: string
          user_id: string
          user_note?: string | null
          wrong_network: string
          wrong_token: string
        }
        Update: {
          accepted_at?: string | null
          admin_note?: string | null
          claimed_amount?: number
          completed_at?: string | null
          created_at?: string
          estimated_return?: number | null
          fee_percent?: number
          id?: string
          processed_tx_hash?: string | null
          quoted_at?: string | null
          sender_address?: string
          status?: string
          tx_hash?: string
          updated_at?: string
          user_id?: string
          user_note?: string | null
          wrong_network?: string
          wrong_token?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          level: number
          metadata: Json | null
          points_awarded: number | null
          qualified_at: string | null
          referee_id: string
          referral_code: string
          referrer_id: string
          rewarded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          metadata?: Json | null
          points_awarded?: number | null
          qualified_at?: string | null
          referee_id: string
          referral_code: string
          referrer_id: string
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          metadata?: Json | null
          points_awarded?: number | null
          qualified_at?: string | null
          referee_id?: string
          referral_code?: string
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_completions: number | null
          name: string
          reward_points: number
          sort_order: number | null
          trigger_condition: Json
          type: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_completions?: number | null
          name: string
          reward_points: number
          sort_order?: number | null
          trigger_condition: Json
          type: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_completions?: number | null
          name?: string
          reward_points?: number
          sort_order?: number | null
          trigger_condition?: Json
          type?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      trade_verifications: {
        Row: {
          counterparty: string
          created_at: string
          db_record: Json
          id: string
          matched_fields: Json
          onchain_log: Json
          trade_id: string
          updated_at: string
          user_id: string
          verification_result: string
          verified_at: string | null
        }
        Insert: {
          counterparty?: string
          created_at?: string
          db_record?: Json
          id?: string
          matched_fields?: Json
          onchain_log?: Json
          trade_id: string
          updated_at?: string
          user_id: string
          verification_result?: string
          verified_at?: string | null
        }
        Update: {
          counterparty?: string
          created_at?: string
          db_record?: Json
          id?: string
          matched_fields?: Json
          onchain_log?: Json
          trade_id?: string
          updated_at?: string
          user_id?: string
          verification_result?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string
          event_name: string
          fee: number
          funding_paid: number
          id: string
          leverage: number
          margin: number
          option_label: string
          order_type: string
          pnl: number | null
          price: number
          product_line: string
          quantity: number
          side: string
          sl_mode: string | null
          sl_value: number | null
          status: string
          tp_mode: string | null
          tp_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          closed_at?: string | null
          created_at?: string
          event_name: string
          fee?: number
          funding_paid?: number
          id?: string
          leverage?: number
          margin: number
          option_label: string
          order_type: string
          pnl?: number | null
          price: number
          product_line?: string
          quantity: number
          side: string
          sl_mode?: string | null
          sl_value?: number | null
          status?: string
          tp_mode?: string | null
          tp_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string
          event_name?: string
          fee?: number
          funding_paid?: number
          id?: string
          leverage?: number
          margin?: number
          option_label?: string
          order_type?: string
          pnl?: number | null
          price?: number
          product_line?: string
          quantity?: number
          side?: string
          sl_mode?: string | null
          sl_value?: number | null
          status?: string
          tp_mode?: string | null
          tp_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: string | null
          amount: number
          confirmations: number | null
          created_at: string
          description: string | null
          id: string
          network: string | null
          required_confirmations: number | null
          status: string
          tx_hash: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account?: string | null
          amount: number
          confirmations?: number | null
          created_at?: string
          description?: string | null
          id?: string
          network?: string | null
          required_confirmations?: number | null
          status?: string
          tx_hash?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string | null
          amount?: number
          confirmations?: number | null
          created_at?: string
          description?: string | null
          id?: string
          network?: string | null
          required_confirmations?: number | null
          status?: string
          tx_hash?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      treasure_drops: {
        Row: {
          created_at: string
          dropped_at: string
          id: string
          points_dropped: number
          target_points: number
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dropped_at?: string
          id?: string
          points_dropped: number
          target_points: number
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          dropped_at?: string
          id?: string
          points_dropped?: number
          target_points?: number
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security: {
        Row: {
          created_at: string
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          points_awarded: number | null
          progress: Json | null
          status: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          progress?: Json | null
          status?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          progress?: Json | null
          status?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_watchlist: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      voucher_daily_pools: {
        Row: {
          claimed_count: number
          created_at: string
          face_value: number
          id: string
          pool_date: string
          total_quota: number
          updated_at: string
        }
        Insert: {
          claimed_count?: number
          created_at?: string
          face_value: number
          id?: string
          pool_date: string
          total_quota: number
          updated_at?: string
        }
        Update: {
          claimed_count?: number
          created_at?: string
          face_value?: number
          id?: string
          pool_date?: string
          total_quota?: number
          updated_at?: string
        }
        Relationships: []
      }
      voucher_earnings: {
        Row: {
          created_at: string
          id: string
          last_settled_at: string | null
          lifetime_credited: number
          pending_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_settled_at?: string | null
          lifetime_credited?: number
          pending_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_settled_at?: string | null
          lifetime_credited?: number
          pending_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voucher_earnings_ledger: {
        Row: {
          airdrop_position_id: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          airdrop_position_id?: string | null
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          airdrop_position_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address: string
          connected_at: string
          created_at: string
          full_address: string
          icon: string
          id: string
          is_primary: boolean
          label: string | null
          network: string
          updated_at: string
          user_id: string
          wallet_type: string
        }
        Insert: {
          address: string
          connected_at?: string
          created_at?: string
          full_address: string
          icon?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          network?: string
          updated_at?: string
          user_id: string
          wallet_type?: string
        }
        Update: {
          address?: string
          connected_at?: string
          created_at?: string
          full_address?: string
          icon?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          network?: string
          updated_at?: string
          user_id?: string
          wallet_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_daily_voucher_pool: {
        Args: { _face_value: number }
        Returns: boolean
      }
      ensure_voucher_pool_today: { Args: never; Returns: undefined }
      gen_voucher_code: { Args: never; Returns: string }
      get_voucher_pool_today: {
        Args: never
        Returns: {
          claimed_count: number
          face_value: number
          remaining: number
          resets_at: string
          total_quota: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_referral_uses: { Args: { _code: string }; Returns: undefined }
      lookup_referral_code: {
        Args: { _code: string }
        Returns: {
          code: string
          is_active: boolean
          referrer_id: string
        }[]
      }
      roll_daily_stock_events: { Args: never; Returns: number }
      sim_market_activity_tick: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
