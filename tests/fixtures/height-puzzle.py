from heapq import *
X=99
p=[5,X,7,1,4,10,8,X,X,0,6,3,0,2,X,9]
e=[1,X,2,3,4,5,6,X,X,7,8,9,10,0,X,0]
H={1:1,2:1,6:1,7:1,3:2,4:2,8:2,9:2,5:3,10:3}
def jjs(ast,dxx):
    mapp={dxx:None}
    move=[dxx]
    p=[0]*16
    for dex in move:
        for j in (1,-1,4,-4):
            dif=dex+j
            if(not-1<dif<16) or (abs(j)==1 and dex//4!=dif//4) or ast[dif]==X or dif in mapp:continue
            mapp[dif]=dex
            move+=[dif]
            p[dif]=1
    drs=[]
    for i in [i for i in range(16) if p[i] and ast[i]==0]:
        load=[]
        while mapp[i]!=None:
            load+=[[i,mapp[i]]]
            i=mapp[i]
        hh = [H.get(ast[fr]) for fr, ba in load[1:]]
        if hh and (len(hh)<2 or None in hh or len(set(hh))!=1):continue
        bw=0
        rou=[]
        for fr,ba in load:
            if rou and rou[-1]==fr:
                if bw==fr-ba:rou[-1]=ba
                else: rou+=[ba]
            else: rou=[fr,ba]
            bw=fr-ba
        drs.append([rou[0],rou[::-1]])
    return drs

def main(st,end):
    mapp={st:0}
    load=[(0,0,st)]
    while load:
        h,g,ast=heappop(load)
        g+=1
        move=[ast.index(i) for i in range(1,11)]
        for dex in move:
            for dif,sw in jjs(ast,dex):
                asd=list(ast)
                asd[dex],asd[dif]=asd[dif],asd[dex]
                asd=tuple(asd)
                if asd not in mapp:
                    mapp[asd]=ast,sw
                    h=0
                    for i in range(1,11):
                        f,e=asd.index(i),end.index(i)
                        if f!=e:
                            h+=(abs(f//4-e//4)+abs(f%4-e%4))
                    if asd==end:
                        print(len(mapp))
                        load=[]
                        while mapp[asd]:
                            asd,sw=mapp[asd]
                            load.append(sw)
                        return load[::-1]
                    heappush(load,(g+h,g,asd))
m=main(tuple(p),tuple(e))
print(len(m))
print(m)
