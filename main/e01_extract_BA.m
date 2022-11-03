%% Extract and combines annual burned areas (in csv files) from different satellite sources 
%
% Burned areas (in csv files) were extracted using the following script:
% https://code.earthengine.google.com/d00964c202fecb84bb7f78a3b1a7c69b

clear all; close all;

years = (1982:2020);
SAT = {'FireCCILT11','MCD64A1','FireCCI51','C3SBA10','Landsat','Sentinel-2'};

%% Extract low-res BA products
BAall = nan(length(years),length(SAT));
BAtundra = nan(length(years),length(SAT));
BAorganic = nan(length(years),length(SAT));
BAcircump = nan(length(years),length(SAT));

for isat = 1:4
    T = readtable(['./DATA/Arctic_BA_' SAT{isat} '.csv']);
    yearsi = table2array(T(1,2:(end-2)));
    BAi = table2array(T(2,2:(end-2)));
    BAj = table2array(T(3,2:(end-2)));
    BAk = table2array(T(4,2:(end-2)));
    BAm = table2array(T(5,2:(end-2)));
    
    [bla,ind1,ind2] = intersect(years,yearsi);
    BAall(ind1,isat) = BAi';
    BAtundra(ind1,isat) = BAj';
    BAorganic(ind1,isat) = BAk';
    BAcircump(ind1,isat) = BAm';
    
end

% FireCCILT11 year 1994 is empty
BAall(years==1994,1) = NaN;
BAtundra(years==1994,1) = NaN;
BAorganic(years==1994,1) = NaN;
BAcircump(years==1994,1) = NaN;


%% Extract Landsat 2013-2017
BAsat = zeros(1,length(2013:2020));
BAsat_tun = zeros(1,length(2013:2020));
BAsat_org = zeros(1,length(2013:2020));
for itile = 0:39
    T = readtable(['./DATA/Arctic_BA_Landsat_S2_20192020/Arctic_BA_Landsat_2013-2020_cell_' num2str(itile) '.csv']); 
    yearsi = table2array(T(1,2:(end-2)));
    BAsat = BAsat+table2array(T(2,2:(end-2)));
    BAsat_tun = BAsat_tun+table2array(T(3,2:(end-2)));
    BAsat_org = BAsat_org+table2array(T(4,2:(end-2)));
end

[bla,ind1,ind2] = intersect(years,yearsi);
BAall(ind1,5) = BAsat'./10000;
BAtundra(ind1,5) = BAsat_tun'./10000;
BAorganic(ind1,5) = BAsat_org'./10000;
BAcircump(ind1,5) = BAsat'./10000;


%% Extract Sentinel-2 2019-2020 
  
BAsat = zeros(1,length(2019:2020));
BAsat_tun = zeros(1,length(2019:2020));
BAsat_org = zeros(1,length(2019:2020));
for itile = 0:39
    T = readtable(['./DATA/Arctic_BA_Landsat_S2_20192020/Arctic_BA_S2_2019-2020_cell_' num2str(itile) '.csv']); 
    yearsi = table2array(T(1,2:(end-2)));
    BAsat = BAsat+table2array(T(2,2:(end-2)));
    BAsat_tun = BAsat_tun+table2array(T(3,2:(end-2)));
    BAsat_org = BAsat_org+table2array(T(4,2:(end-2)));
end

[bla,ind1,ind2] = intersect(years,yearsi);
BAall(ind1,6) = BAsat'./10000;
BAtundra(ind1,6) = BAsat_tun'./10000;
BAorganic(ind1,6) = BAsat_org'./10000;
BAcircump(ind1,6) = BAsat'./10000;


%% SAVE DATA
OUT = array2table([years', BAall]);
OUT.Properties.VariableNames = {'Year',SAT{:}};

OUT2 = array2table([years', BAtundra]);
OUT2.Properties.VariableNames = {'Year',SAT{:}};

OUT3 = array2table([years', BAorganic]);
OUT3.Properties.VariableNames = {'Year',SAT{:}};

OUT4 = array2table([years', BAcircump]);
OUT4.Properties.VariableNames = {'Year',SAT{:}};

writetable(OUT,'./DATA/BA_Arctic_allSatellites_v1.csv')
writetable(OUT2,'./DATA/BA_Tundra_allSatellites_v1.csv')
writetable(OUT3,'./DATA/BA_Organic_allSatellites_v1.csv')
writetable(OUT4,'./DATA/BA_Circumpolar_allSatellites_v1.csv')
