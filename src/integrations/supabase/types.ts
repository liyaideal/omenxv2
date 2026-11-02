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
      announcements: {
        Row: {
          affects: string | null
          body_md: string
          created_at: string
          cta_href: string | null
          cta_label: string | null
          id: string
          kind: string
          locale: string
          not_affected: string | null
          published_at: string | null
          status: string
          summary: string
          title: string
          updated_at: string
          window_ends_at: string | null
          window_starts_at: string | null
        }
        Insert: {
          affects?: string | null
          body_md?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          kind: string
          locale?: string
          not_affected?: string | null
          published_at?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Update: {
          affects?: string | null
          body_md?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          kind?: string
          locale?: string
          not_affected?: string | null
          published_at?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          window_ends_at?: string | null
          window_starts_at?: string | null
        }
        Relationships: []
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
      arcade_acks: {
        Row: {
          accepted_at: string
          user_id: string
          version: number
        }
        Insert: {
          accepted_at?: string
          user_id: string
          version?: number
        }
        Update: {
          accepted_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      arcade_calls: {
        Row: {
          bot_name: string | null
          cancel_fee: number | null
          commission: number | null
          created_at: string
          fee: number
          gross: number
          id: string
          net: number
          p: number
          p_up: number
          pnl: number | null
          quote_idx: number
          quote_ts: string
          s0: number | null
          s0_ts: string | null
          s1: number | null
          s1_ts: string | null
          settled_at: string | null
          side: string
          status: string
          t0: string
          t1: string
          user_id: string | null
          win_payout: number
        }
        Insert: {
          bot_name?: string | null
          cancel_fee?: number | null
          commission?: number | null
          created_at?: string
          fee: number
          gross: number
          id?: string
          net: number
          p: number
          p_up: number
          pnl?: number | null
          quote_idx: number
          quote_ts: string
          s0?: number | null
          s0_ts?: string | null
          s1?: number | null
          s1_ts?: string | null
          settled_at?: string | null
          side: string
          status?: string
          t0: string
          t1: string
          user_id?: string | null
          win_payout: number
        }
        Update: {
          bot_name?: string | null
          cancel_fee?: number | null
          commission?: number | null
          created_at?: string
          fee?: number
          gross?: number
          id?: string
          net?: number
          p?: number
          p_up?: number
          pnl?: number | null
          quote_idx?: number
          quote_ts?: string
          s0?: number | null
          s0_ts?: string | null
          s1?: number | null
          s1_ts?: string | null
          settled_at?: string | null
          side?: string
          status?: string
          t0?: string
          t1?: string
          user_id?: string | null
          win_payout?: number
        }
        Relationships: []
      }
      arcade_feed_req: {
        Row: {
          batch: string
          req_id: number | null
          src: string
        }
        Insert: {
          batch: string
          req_id?: number | null
          src: string
        }
        Update: {
          batch?: string
          req_id?: number | null
          src?: string
        }
        Relationships: []
      }
      arcade_index_ticks: {
        Row: {
          binance: number | null
          coinbase: number | null
          hyperliquid: number | null
          idx: number | null
          p_up: number | null
          r1: number | null
          r30: number | null
          r60: number | null
          reason: string | null
          rv600: number | null
          src_raw: Json | null
          ts: string
          usdt_usd: number | null
          valid: boolean
        }
        Insert: {
          binance?: number | null
          coinbase?: number | null
          hyperliquid?: number | null
          idx?: number | null
          p_up?: number | null
          r1?: number | null
          r30?: number | null
          r60?: number | null
          reason?: string | null
          rv600?: number | null
          src_raw?: Json | null
          ts: string
          usdt_usd?: number | null
          valid?: boolean
        }
        Update: {
          binance?: number | null
          coinbase?: number | null
          hyperliquid?: number | null
          idx?: number | null
          p_up?: number | null
          r1?: number | null
          r30?: number | null
          r60?: number | null
          reason?: string | null
          rv600?: number | null
          src_raw?: Json | null
          ts?: string
          usdt_usd?: number | null
          valid?: boolean
        }
        Relationships: []
      }
      arcade_params: {
        Row: {
          key: string
          note: string | null
          num: number | null
          txt: string | null
        }
        Insert: {
          key: string
          note?: string | null
          num?: number | null
          txt?: string | null
        }
        Update: {
          key?: string
          note?: string | null
          num?: number | null
          txt?: string | null
        }
        Relationships: []
      }
      arcade_probe: {
        Row: {
          acts: Json | null
          at: string | null
          locks: Json | null
          tick_age_s: number | null
        }
        Insert: {
          acts?: Json | null
          at?: string | null
          locks?: Json | null
          tick_age_s?: number | null
        }
        Update: {
          acts?: Json | null
          at?: string | null
          locks?: Json | null
          tick_age_s?: number | null
        }
        Relationships: []
      }
      arcade_rounds: {
        Row: {
          close_price: number | null
          created_at: string
          end_at: string
          id: string
          kind: string
          open_price: number
          seed: number
          sigma: number
          start_at: string
          steps: number
          symbol: string
          tf: string
          winner: string | null
        }
        Insert: {
          close_price?: number | null
          created_at?: string
          end_at: string
          id: string
          kind: string
          open_price: number
          seed: number
          sigma: number
          start_at: string
          steps: number
          symbol: string
          tf: string
          winner?: string | null
        }
        Update: {
          close_price?: number | null
          created_at?: string
          end_at?: string
          id?: string
          kind?: string
          open_price?: number
          seed?: number
          sigma?: number
          start_at?: string
          steps?: number
          symbol?: string
          tf?: string
          winner?: string | null
        }
        Relationships: []
      }
      arcade_sim_state: {
        Row: {
          anchor: number | null
          anchor_at: string | null
          id: number
          req_at: string | null
        }
        Insert: {
          anchor?: number | null
          anchor_at?: string | null
          id?: number
          req_at?: string | null
        }
        Update: {
          anchor?: number | null
          anchor_at?: string | null
          id?: number
          req_at?: string | null
        }
        Relationships: []
      }
      arcade_table_state: {
        Row: {
          breaker_until: string | null
          id: number
          loss_60m: number
          loss_day: number
          open_calls: number
          open_stake: number
          paused_reason: string | null
          updated_at: string
          worst_loss: number
        }
        Insert: {
          breaker_until?: string | null
          id?: number
          loss_60m?: number
          loss_day?: number
          open_calls?: number
          open_stake?: number
          paused_reason?: string | null
          updated_at?: string
          worst_loss?: number
        }
        Update: {
          breaker_until?: string | null
          id?: number
          loss_60m?: number
          loss_day?: number
          open_calls?: number
          open_stake?: number
          paused_reason?: string | null
          updated_at?: string
          worst_loss?: number
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
      campaign_entries: {
        Row: {
          branding: Json
          campaign_id: string
          cap: number | null
          channel_id: string | null
          created_at: string
          id: string
          kind: string
          link_code: string | null
          reward: Json
          rules: Json
          seed_base: number
          updated_at: string
        }
        Insert: {
          branding?: Json
          campaign_id: string
          cap?: number | null
          channel_id?: string | null
          created_at?: string
          id?: string
          kind: string
          link_code?: string | null
          reward?: Json
          rules?: Json
          seed_base?: number
          updated_at?: string
        }
        Update: {
          branding?: Json
          campaign_id?: string
          cap?: number | null
          channel_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          link_code?: string | null
          reward?: Json
          rules?: Json
          seed_base?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_entries_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_grants: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          progress: Json
          status: string
          task_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          progress?: Json
          status?: string
          task_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          progress?: Json
          status?: string
          task_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_grants_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "campaign_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participations: {
        Row: {
          campaign_id: string
          created_at: string
          entry_id: string
          id: string
          joined_at: string
          locked_at: string | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          entry_id: string
          id?: string
          joined_at?: string
          locked_at?: string | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          entry_id?: string
          id?: string
          joined_at?: string
          locked_at?: string | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participations_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "campaign_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_total: number | null
          created_at: string
          ends_at: string | null
          id: string
          name: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          budget_total?: number | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget_total?: number | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          starts_at?: string
          status?: string
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
      channels: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
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
          close_price: number | null
          created_at: string
          description: string | null
          end_date: string | null
          event_subtype: string | null
          expected_settlement_time: string | null
          external_links: Json | null
          freeze_time: string | null
          icon: string
          id: string
          image_blur: string | null
          image_url: string | null
          is_resolved: boolean
          lifecycle_status: string | null
          metadata: Json | null
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
          close_price?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_subtype?: string | null
          expected_settlement_time?: string | null
          external_links?: Json | null
          freeze_time?: string | null
          icon?: string
          id: string
          image_blur?: string | null
          image_url?: string | null
          is_resolved?: boolean
          lifecycle_status?: string | null
          metadata?: Json | null
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
          close_price?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_subtype?: string | null
          expected_settlement_time?: string | null
          external_links?: Json | null
          freeze_time?: string | null
          icon?: string
          id?: string
          image_blur?: string | null
          image_url?: string | null
          is_resolved?: boolean
          lifecycle_status?: string | null
          metadata?: Json | null
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
      fiat_orders: {
        Row: {
          account: string
          card_brand: string | null
          card_last4: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          failure_reason: string | null
          fiat_amount: number
          fiat_code: string
          id: string
          paid_at: string | null
          payment_method: string
          provider: string
          provider_tx_id: string | null
          quote_amount: number
          status: string
          total_fee: number
          transaction_id: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          account?: string
          card_brand?: string | null
          card_last4?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          fiat_amount: number
          fiat_code: string
          id?: string
          paid_at?: string | null
          payment_method?: string
          provider?: string
          provider_tx_id?: string | null
          quote_amount: number
          status?: string
          total_fee?: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          account?: string
          card_brand?: string | null
          card_last4?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          fiat_amount?: number
          fiat_code?: string
          id?: string
          paid_at?: string | null
          payment_method?: string
          provider?: string
          provider_tx_id?: string | null
          quote_amount?: number
          status?: string
          total_fee?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
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
          is_yes: boolean | null
          option_label: string | null
        }
        Insert: {
          amount?: number | null
          boost?: number | null
          created_at?: string
          event_name?: string | null
          id?: string
          is_yes?: boolean | null
          option_label?: string | null
        }
        Update: {
          amount?: number | null
          boost?: number | null
          created_at?: string
          event_name?: string | null
          id?: string
          is_yes?: boolean | null
          option_label?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          dedupe_key: string
          deep_link: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          params: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          dedupe_key: string
          deep_link?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          params?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          dedupe_key?: string
          deep_link?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          params?: Json
          read_at?: string | null
          type?: string
          user_id?: string
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
          instant_paid_at: string | null
          issued_at: string
          max_holding_hours: number
          min_hours_to_settlement: number
          payout_mode: string
          redeemable_cap_pct: number
          redeemed_airdrop_position_id: string | null
          redeemed_at: string | null
          redeemed_event_id: string | null
          redeemed_option_id: string | null
          redeemed_side: string | null
          source_arcade_call_id: string | null
          source_entry_id: string | null
          status: string
          tiered_credited_at: string | null
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
          instant_paid_at?: string | null
          issued_at?: string
          max_holding_hours?: number
          min_hours_to_settlement?: number
          payout_mode?: string
          redeemable_cap_pct?: number
          redeemed_airdrop_position_id?: string | null
          redeemed_at?: string | null
          redeemed_event_id?: string | null
          redeemed_option_id?: string | null
          redeemed_side?: string | null
          source_arcade_call_id?: string | null
          source_entry_id?: string | null
          status?: string
          tiered_credited_at?: string | null
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
          instant_paid_at?: string | null
          issued_at?: string
          max_holding_hours?: number
          min_hours_to_settlement?: number
          payout_mode?: string
          redeemable_cap_pct?: number
          redeemed_airdrop_position_id?: string | null
          redeemed_at?: string | null
          redeemed_event_id?: string | null
          redeemed_option_id?: string | null
          redeemed_side?: string | null
          source_arcade_call_id?: string | null
          source_entry_id?: string | null
          status?: string
          tiered_credited_at?: string | null
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
          {
            foreignKeyName: "position_vouchers_source_arcade_call_id_fkey"
            columns: ["source_arcade_call_id"]
            isOneToOne: true
            referencedRelation: "arcade_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_vouchers_source_entry_id_fkey"
            columns: ["source_entry_id"]
            isOneToOne: false
            referencedRelation: "campaign_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          close_reason: string | null
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
          winning_commission: number
        }
        Insert: {
          close_reason?: string | null
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
          winning_commission?: number
        }
        Update: {
          close_reason?: string | null
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
          winning_commission?: number
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
          affiliate_since: string | null
          auth_method: string | null
          avatar_url: string | null
          balance: number | null
          closed_at: string | null
          created_at: string
          email: string | null
          id: string
          is_affiliate: boolean
          language: string
          notification_prefs: Json
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
          affiliate_since?: string | null
          auth_method?: string | null
          avatar_url?: string | null
          balance?: number | null
          closed_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_affiliate?: boolean
          language?: string
          notification_prefs?: Json
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
          affiliate_since?: string | null
          auth_method?: string | null
          avatar_url?: string | null
          balance?: number | null
          closed_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_affiliate?: boolean
          language?: string
          notification_prefs?: Json
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
      sports_league_map: {
        Row: {
          league: string
          sport: string
        }
        Insert: {
          league: string
          sport: string
        }
        Update: {
          league?: string
          sport?: string
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
          reduce_only: boolean
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
          reduce_only?: boolean
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
          reduce_only?: boolean
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
      apply_campaign_progress:
        | {
            Args: {
              _amount: number
              _at: string
              _event_name: string
              _user_id: string
            }
            Returns: number
          }
        | {
            Args: {
              _amount: number
              _at: string
              _event_name: string
              _metrics: string[]
              _user_id: string
            }
            Returns: number
          }
      arcade_accept_terms: { Args: never; Returns: string }
      arcade_advance: { Args: { p_n: number; p_seed: number }; Returns: number }
      arcade_cancel: { Args: { p_id: string }; Returns: Json }
      arcade_close: {
        Args: {
          p_open: number
          p_seed: number
          p_sigma: number
          p_steps: number
        }
        Returns: number
      }
      arcade_combo_vouchers: { Args: { p_user: string }; Returns: number }
      arcade_feed_tick: { Args: never; Returns: undefined }
      arcade_housekeeping: { Args: never; Returns: undefined }
      arcade_median3: {
        Args: { a: number; b: number; c: number }
        Returns: number
      }
      arcade_my_calls: {
        Args: { p_limit?: number; p_since?: string }
        Returns: {
          bot_name: string | null
          cancel_fee: number | null
          commission: number | null
          created_at: string
          fee: number
          gross: number
          id: string
          net: number
          p: number
          p_up: number
          pnl: number | null
          quote_idx: number
          quote_ts: string
          s0: number | null
          s0_ts: string | null
          s1: number | null
          s1_ts: string | null
          settled_at: string | null
          side: string
          status: string
          t0: string
          t1: string
          user_id: string | null
          win_payout: number
        }[]
        SetofOptions: {
          from: "*"
          to: "arcade_calls"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      arcade_my_session_calls: {
        Args: { p_key: string; p_limit?: number; p_offset?: number }
        Returns: {
          bot_name: string | null
          cancel_fee: number | null
          commission: number | null
          created_at: string
          fee: number
          gross: number
          id: string
          net: number
          p: number
          p_up: number
          pnl: number | null
          quote_idx: number
          quote_ts: string
          s0: number | null
          s0_ts: string | null
          s1: number | null
          s1_ts: string | null
          settled_at: string | null
          side: string
          status: string
          t0: string
          t1: string
          user_id: string | null
          win_payout: number
        }[]
        SetofOptions: {
          from: "*"
          to: "arcade_calls"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      arcade_my_sessions: {
        Args: { p_limit?: number }
        Returns: {
          active: boolean
          best_run: number
          biggest_win: number
          calls: number
          cancelled: number
          commission: number
          ended_at: string
          fees: number
          last_settled_at: string
          lost: number
          max_stake: number
          min_stake: number
          payout: number
          pnl: number
          refunded: number
          session_key: string
          staked: number
          started_at: string
          won: number
        }[]
      }
      arcade_open_round: {
        Args: {
          p_kind: string
          p_name: string
          p_open: number
          p_seed: number
          p_start: string
          p_symbol: string
          p_tf: string
        }
        Returns: boolean
      }
      arcade_param: { Args: { p_key: string }; Returns: number }
      arcade_path: {
        Args: {
          p_open: number
          p_seed: number
          p_sigma: number
          p_steps: number
        }
        Returns: number[]
      }
      arcade_place: {
        Args: { p_gross: number; p_quote_ts: string; p_side: string }
        Returns: Json
      }
      arcade_real_btc: { Args: never; Returns: number }
      arcade_road: {
        Args: { p_slots?: number }
        Returns: {
          close_idx: number
          open_idx: number
          slot_start: string
        }[]
      }
      arcade_round_half_up: {
        Args: { p: number; p_scale: number }
        Returns: number
      }
      arcade_settle_due: { Args: { p_user?: string }; Returns: Json }
      arcade_settle_mine: { Args: never; Returns: Json }
      arcade_sim_feed: { Args: never; Returns: undefined }
      arcade_sim_tick: {
        Args: { p_pup: number; p_ts: string }
        Returns: undefined
      }
      arcade_stall_probe: { Args: never; Returns: undefined }
      arcade_state_at: {
        Args: { p_at: string; p_symbol: string }
        Returns: Record<string, unknown>
      }
      arcade_synth_tick: { Args: never; Returns: undefined }
      arcade_table_feed: {
        Args: never
        Returns: {
          gross: number
          id: string
          mine: boolean
          p: number
          side: string
          t0: string
          t1: string
          who: string
        }[]
      }
      arcade_table_now: { Args: never; Returns: Json }
      archive_sports_result: { Args: { p_id: string }; Returns: undefined }
      campaign_hold_sweep: { Args: never; Returns: number }
      campaign_metric_value: {
        Args: {
          _from: string
          _metric: string
          _task: Json
          _to: string
          _user_id: string
        }
        Returns: number
      }
      campaign_period_key: {
        Args: { _at: string; _period: string }
        Returns: string
      }
      campaign_period_prev: {
        Args: { _period: string; _start: string }
        Returns: string
      }
      campaign_period_start: {
        Args: { _at: string; _period: string }
        Returns: string
      }
      campaign_recurring_apply: {
        Args: {
          _at: string
          _entry_id: string
          _joined_at: string
          _task: Json
          _user_id: string
        }
        Returns: undefined
      }
      campaign_scope_matches: {
        Args: { _event_name: string; _scope: Json }
        Returns: boolean
      }
      campaign_settle_grant: {
        Args: {
          _entry_id: string
          _key: string
          _label: string
          _reward: Json
          _target: number
          _user_id: string
          _value: number
        }
        Returns: string
      }
      consume_daily_voucher_pool: {
        Args: { _face_value: number }
        Returns: boolean
      }
      ensure_soccer_lines: { Args: { p_fixture_id: string }; Returns: number }
      ensure_us_sport_lines: {
        Args: { fx: string; hcp: number; tot: number }
        Returns: number
      }
      ensure_voucher_pool_today: { Args: never; Returns: undefined }
      freeze_expired_events: { Args: never; Returns: number }
      gen_voucher_code: { Args: never; Returns: string }
      get_campaign_entry_joined: {
        Args: never
        Returns: {
          campaign_id: string
          entry_id: string
          joined: number
        }[]
      }
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
      insights_accuracy: {
        Args: { p_from: string; p_to?: string }
        Returns: Json
      }
      insights_event_activity: {
        Args: { p_from: string; p_to?: string }
        Returns: {
          event_name: string
          trades: number
          volume: number
        }[]
      }
      insights_movers: {
        Args: { p_from: string; p_to?: string }
        Returns: {
          event_id: string
          first_at: string
          first_price: number
          last_at: string
          last_price: number
          option_id: string
        }[]
      }
      insights_platform_stats: { Args: never; Returns: Json }
      insights_series: {
        Args: { p_from: string; p_option_ids: string[]; p_to?: string }
        Returns: {
          option_id: string
          price: number
          recorded_at: string
        }[]
      }
      insights_series_detail: { Args: { p_slug: string }; Returns: Json }
      insights_series_list: { Args: never; Returns: Json }
      insights_snapshot_prices: { Args: never; Returns: undefined }
      insights_updown_rounds: {
        Args: { p_from?: string }
        Returns: {
          asset: string
          down_price: number
          end_date: string
          event_id: string
          family: string
          freeze_time: string
          is_resolved: boolean
          mins: number
          slug: string
          start_date: string
          ticker: string
          up_price: number
          up_won: boolean
          volume: number
        }[]
      }
      list_my_sessions: {
        Args: never
        Returns: {
          created_at: string
          id: string
          ip: string
          is_current: boolean
          last_active_at: string
          user_agent: string
        }[]
      }
      lookup_referral_code: {
        Args: { _code: string }
        Returns: {
          code: string
          is_active: boolean
          referrer_id: string
        }[]
      }
      mark_notifications_read: { Args: { p_ids?: string[] }; Returns: number }
      notif_session_date: { Args: { p_option_id: string }; Returns: string }
      notification_category: { Args: { p_type: string }; Returns: string }
      notify: {
        Args: {
          p_dedupe?: string
          p_deep_link?: string
          p_entity_id?: string
          p_entity_type?: string
          p_params?: Json
          p_type: string
          p_user: string
        }
        Returns: string
      }
      notify_campaign_ending: { Args: never; Returns: number }
      notify_expiring: { Args: never; Returns: number }
      notify_self: {
        Args: { p_dedupe?: string; p_params?: Json; p_type: string }
        Returns: string
      }
      notify_watchlist_live: { Args: never; Returns: number }
      position_side_labels: { Args: { p_option_id: string }; Returns: Json }
      position_trade_link: { Args: { p_option_id: string }; Returns: string }
      purge_notifications: { Args: never; Returns: number }
      reprice_soccer_lines: { Args: { p_fixture_id: string }; Returns: number }
      roll_arcade_rounds: { Args: never; Returns: Json }
      roll_crypto_quick_rounds: { Args: never; Returns: Json }
      roll_daily_hk_stock_events: { Args: never; Returns: number }
      roll_daily_stock_events: { Args: never; Returns: number }
      roll_demo_campaign_daily: { Args: never; Returns: undefined }
      roll_demo_positions: { Args: never; Returns: Json }
      roll_sports_matches: { Args: never; Returns: Json }
      settle_arcade_round: {
        Args: { p_event_id: string; p_void?: boolean }
        Returns: number
      }
      settle_futures_event: { Args: { p_event_id: string }; Returns: number }
      settle_futures_sweep: { Args: never; Returns: number }
      settle_prior_stock_session: {
        Args: { _subtype: string }
        Returns: number
      }
      settle_quick_contract_round: {
        Args: { p_event_id: string }
        Returns: number
      }
      settle_spot_event: { Args: { p_event_id: string }; Returns: number }
      sim_market_activity_tick: { Args: never; Returns: number }
      sim_poisson: { Args: { p_lambda: number }; Returns: number }
      sim_price_tick: { Args: never; Returns: number }
      soccer_line_prices: {
        Args: { p_away: number; p_draw: number; p_home: number }
        Returns: {
          line: number
          market_type: string
          yes_price: number
        }[]
      }
      soccer_winner_prices: {
        Args: { p_fixture_id: string }
        Returns: Record<string, unknown>
      }
      tick_demo_showcase: { Args: never; Returns: Json }
      tick_demo_wta: { Args: never; Returns: Json }
      tick_live_matches: { Args: never; Returns: Json }
      tick_live_us_sports: { Args: never; Returns: Json }
      top_up_demo_voucher_volume: { Args: never; Returns: Json }
      us_session_open: { Args: { p_at?: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
