clear all; close all;

P = readtable('.\DATA\BA_Arctic_FIRMS_perimeters_v1.csv');

META = [];
OUT = [];

for yy = 2008:2020;

    BA = readtable(['./DATA/ERA5hourly/ERA5_ignitions_' num2str(yy) '.csv']);

    BA.Properties.VariableNames

    % BA(BA.lon<138,:) = []


    ids = unique(BA.fireid);

    for ii = 1:length(ids)
        indP = find(P.fireid==ids(ii));
        indP = indP(1);

        ind = BA.fireid==ids(ii);
        BAii = BA(ind,:);
        BAii = sortrows(BAii,'date1');

        doyGEE = BAii.date1; % dateGEE/86400000
        doyMatlab = doyGEE+datenum(1970,1,1);
        [YY,MM,DD] = datevec(doyMatlab);
        doy = doyMatlab-datenum(YY-1,12,31);

        minDoy = P.minDoy(indP);
        maxDoy = P.maxDoy(indP)+1;


        maxDoy2 = minDoy;
        minDoy2 = minDoy-30;

        BAii1 = BAii(doy>minDoy(1) & doy<maxDoy(1),[3 9 10 11 12]);
        BAii2 = BAii(doy>minDoy2(1) & doy<maxDoy2(1),[3 9 10 11 12]);

        if not(isempty(BAii2.total_precipitation_hourly)) & not(isempty(BAii1.temperature_2m-273.15)) ...
                & not(isempty(BAii2.v_component_of_wind_10m)) & not(isempty(BAii1.u_component_of_wind_10m))
            META = [META; ids(ii) yy];
            OUT = [OUT; P.BurnedArea(indP) nanmax(BAii1.temperature_2m-273.15) ...
                nanmax(BAii2.total_precipitation_hourly) ...
                nanmean(BAii1.v_component_of_wind_10m)  nanmean(BAii1.u_component_of_wind_10m)];
        end
    end

end

save('./DATA/STATS_ERA5hourly_ignitions','META','OUT')
