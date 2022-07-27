''' generates .czml file from a list of points'''

from datetime import timedelta
from astropy import coordinates
from czml import (CZML, CZMLPacket, Description,
                   Position,Point,Color)
from matplotlib import cm
cmap = cm.get_cmap('Spectral')


AVAILABILITY_DURATION = 60*60*6 # Seconds

class ScatterPoint:
    point_id = 0
    def __init__(self,time,lat,lon,alt,value):
        self.time = time
        self.lat = lat
        self.lon = lon
        self.alt = alt
        self.value = value
        ScatterPoint.point_id += 1 
        self.id = f'{ScatterPoint.point_id}'
        xyz = coordinates.EarthLocation.from_geodetic(lon, lat,alt).value
        self.x = xyz[0]
        self.y = xyz[1]
        self.z = xyz[2]

    def get_lla(self):
        return (self.lat,self.lon,self.alt)

    def get_xyz(self):
        return (self.x,self.y,self.z)

    def get_txyz(self):
        return (self.time,self.x,self.y,self.z)

    def get_value(self):
        return (self.value)

    def get_time(self):
        return (self.time)
        
    def get_id(self):
        return (self.id)

   
# Inialize CZML
def create_czml_file(start_time, end_time):
    'create czml file using start_time and end_time'
    interval = get_interval(start_time, end_time)
    doc = CZML()
    packet = CZMLPacket(id='document', version='1.0')
    print(interval)
    print(start_time.isoformat())

    packet.clock = {"interval": interval, "currentTime": start_time.isoformat(
    ), "multiplier": 60, "range": "LOOP_STOP", "step": "SYSTEM_CLOCK_MULTIPLIER"}
    doc.packets.append(packet)
    return doc


def create_point_packet(point,availability_duration=86400):
    'Creates a packet from a point'
    packet = CZMLPacket(id=point.get_id())
    packet.availability = get_interval(point.get_time(), point.get_time()+timedelta(seconds=availability_duration))
    packet.description = Description(f'Value {point.get_value()}')
    pos = Position()
    pos.cartesian = point.get_xyz()
    packet.position = pos
    pnt = Point()
    color = Color()
    color.rgba = [int(round(elem*255)) for elem in cmap(point.get_value())]
    pnt.show = True
    pnt.color = color
    pnt.pixelSize = 10
    packet.point = pnt
    return packet


def get_interval(current_time, end_time):
    'creates an interval string'
    return current_time.isoformat() + "/" + end_time.isoformat()


def df_to_czml(df, start_time, end_time,czml='scatter.czml',availability_duration=86400):
    """
    Converts df with time, lat, lon, alts, values to CZML
    """
    doc = create_czml_file(start_time, end_time)
    for ii,row in df.iterrows():
        point = ScatterPoint(row['Time'],row['Lat'],row['Lon'],row['Alt'],row['Val'])
        point_packet = create_point_packet(point,availability_duration=availability_duration)
        doc.packets.append(point_packet)
    
    with open(czml,'w') as f:
        f.writelines(doc.dumps())

    print('Done')
