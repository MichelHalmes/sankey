
import psycopg2
import pandas as pd
import pickle
from tabulate import tabulate
from datetime import datetime
import json
import re

from _config_CONFIDENTIAL import connect_kwargs, query, SESSION_DURATION_M


print 'Start...'
# with psycopg2.connect(**connect_kwargs) as con:
#     with con.cursor() as cur:
#         cur.execute(query)
#         df = pd.DataFrame(cur.fetchall())
#         df.columns = [desc[0] for desc in cur.description]
#
# pickle.dump(df, open( "save.p", "wb" ) )
# df = pickle.load(open( "save.p", "rb" ) )

df = pd.read_csv('query.csv')
df.rename(columns={'client': 'client_id'}, inplace=True)
# print tabulate(df, headers='keys', tablefmt='psql')
print 'Got data...'
# print df.datetime.min()
# print df.datetime.max()

CLEAN_RE = re.compile(r'^[a-z\_\.0-9]+$')

print 'Removing...'
# REMOVE EVENTS
df = df[df.action.map(lambda a: not not CLEAN_RE.match(a) and \
                                a not in ['click_through'])]
df.context = df.context.map(lambda c: str(c).split('.', 1)[0])
df.datetime = df.datetime.map(lambda d: datetime.strptime(d if '.' in d else d+'.0', "%Y-%m-%d %H:%M:%S.%f"))

df = df[df.context.map(lambda c: not not CLEAN_RE.match(c) and \
                                 not c.endswith('VC') and \
                                 not c.endswith('Controller') and \
                                 c not in ['generic', 'nan', 'unknown'])]



print 'Sorting...'
# SORT
df = df.sort_values(by=['client_id', 'datetime'])

print 'Joining...'
# JOIN ON PREVIOUS EVENT
def join_prev(group):
    # group = pd.DataFrame(group)
    group = group.reset_index()

    group.sort_values(by='datetime')
    # JOIN ON PREVIOUS
    group['prev_datetime'] = group.datetime.shift(1)
    group['prev_context'] = group.context.shift(1)

    # EDIT FIRST AND LAST EVENT
    group['prev_context'].iloc[0] = 'session_start'
    group['prev_datetime'].iloc[0] = group['datetime'].iloc[0]
    exit_event = {'context': 'end_session', 'prev_context': group['context'].iloc[-1],
        'datetime': group['datetime'].iloc[-1], 'prev_datetime': group['datetime'].iloc[-1] }
    exit_df = pd.DataFrame(exit_event, index=[0])
    group = group.append(exit_df, ignore_index=True)


    for ix, row in group.iterrows():
        if (row['datetime']-row['prev_datetime']).seconds > 60*SESSION_DURATION_M:

            exit_event = {'context': 'end_session', 'prev_context': row['prev_context'],
                'datetime': row['prev_datetime'], 'prev_datetime': row['prev_datetime'] }
            exit_df = pd.DataFrame(exit_event, index=[0])
            group = group.append(exit_df, ignore_index=True)

            group['prev_context'].iloc[ix] = 'session_start'
            group['prev_datetime'].iloc[ix] = row['datetime']

    return group


df = df.groupby(df.client_id).apply(join_prev)

# print tabulate(df[['client_id',  'datetime', 'context', 'action']], headers='keys', tablefmt='psql')
print 'Filtering...'
df = df[df.context!=df.prev_context]


# KEEP ONLY CUSTOMER-FLOW COLUMNS
df = df[['prev_context', 'context']]
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
