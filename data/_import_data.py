
import psycopg2
import pandas as pd
import pickle
from tabulate import tabulate
from datetime import timedelta
import json

from _config_CONFIDENTIAL import connect_kwargs, query



with psycopg2.connect(**connect_kwargs) as con:
    with con.cursor() as cur:
        cur.execute(query)
        df = pd.DataFrame(cur.fetchall())
        df.columns = [desc[0] for desc in cur.description]

# pickle.dump(df, open( "save.p", "wb" ) )
# df = pickle.load(open( "save.p", "rb" ) )

# SORT
df = df.sort_values(by=['client_id', 'datetime'])

# JOIN ON PREVIOUS EVENT
def join_prev(group):
    group.sort_values(by='datetime')
    group['prev_datetime'] = group.datetime.shift(1)
    group['prev_type'] = group.type.shift(1)

    group['prev_type'].iloc[0] = 'session_start:whatever'
    group['prev_datetime'].iloc[0] = group['datetime'].iloc[0]
    exit_event = {'type': 'end_session:whatever', 'prev_type': group['type'].iloc[-1],
        'datetime': group['datetime'].iloc[-1], 'prev_datetime': group['datetime'].iloc[-1] }
    exit_df = pd.DataFrame(exit_event, index=[0])
    group = group.append(exit_df)
    return group

df = df.groupby(df.client_id).apply(join_prev)

# FILTER NULL AND INACTIVE SESSIONS
# MAX_INACTIVITY_TIME = timedelta(seconds = 60*15)
# df = df[(df.prev_type.notnull()) & (df.datetime - df.prev_datetime < MAX_INACTIVITY_TIME) ]

# KEEP ONLY CUSTOMER-FLOW COLUMNS
df = df[['prev_type', 'type']].applymap(lambda t: t.split(':')[0])
df.columns = ['source_0', 'target_0']


# GENERATE THE LINKS
result_df = df.groupby(['source_0', 'target_0']).size().reset_index(name='value')
links = result_df.to_dict(orient='records')

print tabulate(result_df, headers='keys', tablefmt='psql')


# FIND ALL LEVEL_0 STATES
df  = pd.DataFrame(pd.concat([result_df.source_0, result_df.target_0]), columns=['level_0'])
df = df.groupby('level_0', as_index=False).size().reset_index(name='cnt')
df = df.drop('cnt', 1)

# GENERATE LEVEL_1 FROM LEVEL_0
df['level_1'] = df['level_0'].apply(lambda l0: l0.split('.', 1)[0])
nodes = df.to_dict(orient='records')

# DUMP TO JSON
data = {'links': links, 'nodes': nodes}
with open('redshiftData.json', 'w') as fp:
    json.dump(data, fp, sort_keys=True, indent=4)
