#%%
from ScatterToCZML import *
from datetime import datetime,timezone
import pandas as pd
import numpy as np

# Inputs

start_time = datetime(2022, 7, 24, 00, 00) #YYYY MM DD HH mm
end_time = datetime(2022, 7, 25, 00, 00)
point_availability_durations = 60*60*12

# df_to_czml(df, start_time, end_time)

df = pd.read_csv('llaData.csv')
df = df.drop(['Lat Rate (deg/sec)','Lon Rate (deg/sec)'],axis=1)
df.columns = ['Time','Lat','Lon','Alt','Val']
df['Time'] = df['Time'].apply(lambda t: start_time+timedelta(seconds=t))
df['Val'] = (df['Val']-df['Val'].min())/(df['Val'].max()-df['Val'].min()) # Normalize between 0 and 1
df['Alt'] *= 1000

# %%
start_time = df.iloc[0,0]
end_time = df.iloc[-1,0]
df_to_czml(df,start_time,end_time,availability_duration=point_availability_durations)
