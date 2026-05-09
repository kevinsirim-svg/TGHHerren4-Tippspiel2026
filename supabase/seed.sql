-- ============================================================
-- NBA Teams Seed
-- IDs entsprechen den balldontlie.io team IDs (siehe https://docs.balldontlie.io)
-- ============================================================

insert into public.teams (id, abbreviation, full_name, conference) values
  (1,  'ATL', 'Atlanta Hawks',           'East'),
  (2,  'BOS', 'Boston Celtics',          'East'),
  (3,  'BKN', 'Brooklyn Nets',           'East'),
  (4,  'CHA', 'Charlotte Hornets',       'East'),
  (5,  'CHI', 'Chicago Bulls',           'East'),
  (6,  'CLE', 'Cleveland Cavaliers',     'East'),
  (7,  'DAL', 'Dallas Mavericks',        'West'),
  (8,  'DEN', 'Denver Nuggets',          'West'),
  (9,  'DET', 'Detroit Pistons',         'East'),
  (10, 'GSW', 'Golden State Warriors',   'West'),
  (11, 'HOU', 'Houston Rockets',         'West'),
  (12, 'IND', 'Indiana Pacers',          'East'),
  (13, 'LAC', 'LA Clippers',             'West'),
  (14, 'LAL', 'Los Angeles Lakers',      'West'),
  (15, 'MEM', 'Memphis Grizzlies',       'West'),
  (16, 'MIA', 'Miami Heat',              'East'),
  (17, 'MIL', 'Milwaukee Bucks',         'East'),
  (18, 'MIN', 'Minnesota Timberwolves',  'West'),
  (19, 'NOP', 'New Orleans Pelicans',    'West'),
  (20, 'NYK', 'New York Knicks',         'East'),
  (21, 'OKC', 'Oklahoma City Thunder',   'West'),
  (22, 'ORL', 'Orlando Magic',           'East'),
  (23, 'PHI', 'Philadelphia 76ers',      'East'),
  (24, 'PHX', 'Phoenix Suns',            'West'),
  (25, 'POR', 'Portland Trail Blazers',  'West'),
  (26, 'SAC', 'Sacramento Kings',        'West'),
  (27, 'SAS', 'San Antonio Spurs',       'West'),
  (28, 'TOR', 'Toronto Raptors',         'East'),
  (29, 'UTA', 'Utah Jazz',               'West'),
  (30, 'WAS', 'Washington Wizards',      'East')
on conflict (id) do nothing;
