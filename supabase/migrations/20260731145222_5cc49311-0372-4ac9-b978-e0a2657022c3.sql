update public.events e
set image_url = src.image_url
from public.events src
where src.id = 'us-' || split_part(e.id, '-', 2) || '-updown-20260731'
  and e.id like 'us-%-updown-%'
  and e.id <> src.id
  and src.image_url is not null;