CREATE TABLE WenshuList(
  main_text text,
  reason_not_open text,
  ws_type text,
  ws_time text,
  ws_name text,
  ID  text,
  program text,
  ws_number text,
  court_name text,
  run_eval text
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
CREATE TABLE WenshuData(
  jsonData text
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;