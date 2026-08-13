UPDATE public.campaign_entries e
SET rules = e.rules || jsonb_build_object(
  'details', jsonb_build_object(
    'heading', 'Campaign rules',
    'paragraphs', jsonb_build_array(
      'Progress only counts while the campaign is running. Trades placed before the start date or after the end date are not counted, and task progress is measured on the markets listed in each task''s scope.',
      'A Trial Position Voucher opens one trial position. Any profit from that position is yours; the voucher face value itself stays with OmenX and is never withdrawable. USDC amounts shown on this page are estimates.',
      'One account per person. Accounts sharing a device, funding route or coordinated trading pattern may be removed from the campaign, and any unclaimed rewards voided. OmenX may adjust or end the campaign at any time.'
    )
  )
)
WHERE NOT (e.rules ? 'details');