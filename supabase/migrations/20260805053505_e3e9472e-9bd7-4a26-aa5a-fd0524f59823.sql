insert into public.events (id,name,icon,category,description,rules,start_date,end_date,volume,is_resolved,product_lines) values
('fin-nvda-4t-2026','Will NVIDIA close above $4T market cap this quarter?','📈','finance','Long-running market on the NVDA market capitalisation.','Settles on the NVDA closing market cap on the last trading day of the quarter.',now(),now()+interval '52 days','4820000',false,'{futures}'),
('fin-spx-6500-2026','Will the S&P 500 index close above 6,500 in 2026?','📊','finance','Index question on the S&P 500 (SPX) full-year close.','Settles on the official SPX closing level on the final trading day of 2026.',now(),now()+interval '120 days','9130000',false,'{futures}'),
('fin-hsi-25000-2026','Will the Hang Seng Index (HSI) top 25,000 this year?','📊','finance','Hong Kong index question on the HSI.','Settles on the official HSI closing level.',now(),now()+interval '95 days','3410000',false,'{futures}'),
('fin-tencent-500-2026','Will Tencent (0700.HK) close above HK$500 this quarter?','🏢','finance','Hong Kong single-name question on Tencent.','Settles on the 0700.HK closing price on the last trading day of the quarter.',now(),now()+interval '61 days','2260000',false,'{futures}'),
('fin-gold-3000-2026','Will gold close above $3,000/oz before December?','🥇','finance','Commodities question on spot gold.','Settles on the LBMA gold PM auction price.',now(),now()+interval '88 days','5140000',false,'{futures}'),
('fin-brent-band-2026','Where does Brent crude close this quarter?','🛢️','finance','Multi-outcome market on the Brent crude quarterly settlement.','Settles on the front-month Brent settlement price on the last trading day of the quarter.',now(),now()+interval '58 days','3980000',false,'{futures}'),
('fin-eurusd-parity-2026','Will EUR/USD trade below 1.00 this year?','💱','finance','FX question on the euro against the dollar.','Settles on the WM/Reuters 16:00 London fix.',now(),now()+interval '110 days','2870000',false,'{futures}'),
('fin-samsung-kospi-2026','Will Samsung Electronics lead the KOSPI higher this quarter?','🇰🇷','finance','Korea single-name question on Samsung Electronics versus the KOSPI.','Settles on quarterly closing performance of Samsung Electronics against the KOSPI index.',now(),now()+interval '64 days','1240000',false,'{futures}');

insert into public.event_options (id,event_id,label,price) values
('fin-nvda-4t-2026-yes','fin-nvda-4t-2026','Yes',0.47),('fin-nvda-4t-2026-no','fin-nvda-4t-2026','No',0.53),
('fin-spx-6500-2026-yes','fin-spx-6500-2026','Yes',0.61),('fin-spx-6500-2026-no','fin-spx-6500-2026','No',0.39),
('fin-hsi-25000-2026-yes','fin-hsi-25000-2026','Yes',0.34),('fin-hsi-25000-2026-no','fin-hsi-25000-2026','No',0.66),
('fin-tencent-500-2026-yes','fin-tencent-500-2026','Yes',0.42),('fin-tencent-500-2026-no','fin-tencent-500-2026','No',0.58),
('fin-gold-3000-2026-yes','fin-gold-3000-2026','Yes',0.72),('fin-gold-3000-2026-no','fin-gold-3000-2026','No',0.28),
('fin-brent-band-2026-below70','fin-brent-band-2026','Below $70',0.23),('fin-brent-band-2026-70-85','fin-brent-band-2026','$70–$85',0.55),('fin-brent-band-2026-above85','fin-brent-band-2026','Above $85',0.22),
('fin-eurusd-parity-2026-yes','fin-eurusd-parity-2026','Yes',0.19),('fin-eurusd-parity-2026-no','fin-eurusd-parity-2026','No',0.81),
('fin-samsung-kospi-2026-yes','fin-samsung-kospi-2026','Yes',0.56),('fin-samsung-kospi-2026-no','fin-samsung-kospi-2026','No',0.44);