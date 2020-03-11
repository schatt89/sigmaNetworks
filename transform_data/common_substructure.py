 
import networkx as nx

def has_a_link(G1,G2,u,v):
    b1 = G1.has_edge(u,v)
    b2 = G2.has_edge(u,v)
    b = False
    if b1 == True and b2 == True:
        b = True
    elif b1 == False and b2 == False:
        b = True
    else:
        b = False
    return b

def common_sub_structure(G1,G2):
    # add more zeros to both networks
    G = nx.Graph()
    nn = [u for u in G1 if u in G2]
    aa =[(u,v) for u in nn for v in nn if u!=v and has_a_link(G1,G2,u,v)]
    G.add_edges_from(aa)
    ##############################
    clq2 = list(nx.find_cliques(G))
    if len(clq2) > 0:
        maxcl = clq2[0]
        size = len(maxcl)
        for cl in clq2:
            if len(cl) > size:
                maxcl = cl
                size = len(cl)
    return maxcl

from itertools import product
def get_categories():
    '''
    This function generates investor category labels and assigns them an
    increasing index
    '''
    por_labels = ['Helsinki', 'Rest-Uusimaa', 'Eastern-Tavastia',
                  'South-West', 'Western-Tavastia', 'Central-Finland',
                  'South-East', 'Ostrobothnia', 'Northern-Savonia',
                  'Eastern-Finland', 'Northern-Finland']
    ia_house = ['Under-Age', 'Young', 'Middle-Age', 'Mature', 'Retired']
    ia_non_h = ['no-age']
    household = ['Households']
    non_house = ['Non-Financial', 'Financial-Insurance',
                 'General-Government', 'Non-Profit', 'Rest-World']

    houseGroups = list(product(household, por_labels, ia_house))
    nonHoGroups = list(product(non_house, por_labels, ia_non_h))
    totalGroups = nonHoGroups + houseGroups
    groups = {name: idx for idx, name in enumerate(totalGroups)}
    return groups

def update_atr(G):
    groups = get_categories()
    sector_code = {}
    postal_code = {}
    age = {}
    for node in G:
        kk = [k for k, v in groups.items() if v == int(node)]
        at = kk[0]
        sector_code.update({node:at[0]}) 
        postal_code.update({node:at[1]})
        age.update({node:at[2]}) 
    nx.set_node_attributes(G, sector_code, name='sector_code')
    nx.set_node_attributes(G, postal_code, name='postal_code')
    nx.set_node_attributes(G, age, name='age')
    return G

def update_link_atr(G):
    d = {}
    for a,b in G.edges():
        sameA = 0
        sameR = 0
        if G.nodes[a]['postal_code'] == G.nodes[b]['postal_code']:
            sameR = 1
        if G.nodes[a]['age'] == G.nodes[b]['age']:
            sameA = 1
        
        d[(a,b)] = {'sameRegion': sameR, 'sameAge': sameA}

    nx.set_edge_attributes(G, d)
    return G
    
B = nx.read_graphml('FI0009000665'+'_before.graphml')
D = nx.read_graphml('FI0009000665'+'_during.graphml')
B = update_atr(B)
D  = update_atr(D)
B = update_link_atr(B)
D = update_link_atr(D)

B_json = nx.node_link_data(B)
D_json = nx.node_link_data(D)
clique = common_sub_structure(B,D)
import json
with open('before.json','w') as jf1:
    json.dump(B_json,jf1)
with open('during.json','w') as jf2:
    json.dump(D_json,jf2)