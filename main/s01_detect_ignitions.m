clear all; close all

addpath('./auxiliary_code')

sensor = 'modis'; %'viirs-snpp'; %'modis'
yearsList = 2001:2020 %2012:2020 %2001:2020

for yy = yearsList
    
% Arctic all
pathData = ['C:\Users\adria\OneDrive - CREAF\PALM_PROJECT\_FIRE\_ARCTICfires_paper\R0_raw_backup\FIRMS_Russian_Federation\raw_data_' sensor '\'];
T = readtable([pathData sensor '_' num2str(yy) '_Russian_Federation.csv']);

T(T.latitude<65,:) = [];
T(T.longitude<72,:) = []; % avoid industrial areas in western siberia

[YY,MM,DD] = datevec(T.acq_date);
doy = datenum(T.acq_date)-datenum(YY,1,1)+1;
T = [array2table([YY,MM,DD,doy]) T];
T.Properties.VariableNames = {'YY','MM','DD','doy',T.Properties.VariableNames{5:end}};

lagDay = 30;
mindDist = 10;

%%



lat = T.latitude;
lon = T.longitude;
doy = T.doy;

% figure, 
% s = scatter3(lat,lon,doy,[],doy,'filled')
% colormap jet
% s.SizeData = 20;
% xlabel('latitude')
% ylabel('longitude')
% zlabel('DoY')
% 
% figure, 
% scatter(lon,lat,[],doy,'filled')
% colormap jet



%%
plotResults1 = false;
plotResults2 = false;


uniquedoy = unique(doy);
status = zeros(length(doy),1);
fireid = zeros(length(doy),1); 

if plotResults1
    figure('units','normalized','outerposition',[0 0 1 1]), hold on
        plot(lon,lat,'.k')
    %     scatter(lon,lat,[],doy,'filled')
        colormap jet
end
      
if plotResults2
    figure('units','normalized','outerposition',[0 0 1 1]), hold on
        s = plot(lon,lat,'.c')
end

for ii = 1:length(uniquedoy)
   idoy = uniquedoy(ii);
   indBool = doy==idoy; 
   ind = find(indBool);
   lati = lat(ind);
   loni = lon(ind);
   
   for jj = 1:length(lati)
       indSurr = (doy-idoy)<0 & (doy-idoy)>-lagDay & abs((lat-lati(jj)))<0.2 & abs((lon-loni(jj)))<0.2;
       if sum(indSurr) == 0
           status(ind(jj)) = 1;
       else
            minDist2 = distance(lati(jj),loni(jj),lat(indSurr),lon(indSurr));
            dist2site = deg2km(minDist2);
            if min(dist2site)>mindDist
                status(ind(jj)) = 1;
            else
                status(ind(jj)) = 3;
            end
       end
   end
   
   
   for jj = 1:length(lati)
       if status(ind(jj)) == 1
           indSurr = (doy-idoy)==0 & abs((lat-lati(jj)))<0.2 & abs((lon-loni(jj)))<0.2;
           statusSurr = status(indSurr);
           minDist2 = distance(lati(jj),loni(jj),lat(indSurr),lon(indSurr));
           dist2site = deg2km(minDist2);
           
           if sum(dist2site<10)>1
               if max(statusSurr(dist2site<10)) == 3
                   status(ind(jj)) = 3;
               end
           end
           
       end
   end
   
% T1 = clusterdata(X,3);
   %%
%    if idoy==175
%        return
%    end
   
   if sum((status==1 & doy==idoy))>1
       indnew = find(status==1 & doy==idoy);
       latnew = lat(indnew);
       lonnew = lon(indnew);

%        C = clusterdata([latnew lonnew],15);
       [clustersCentroids,clustersGeoMedians,clustersXY,C] = clusterXYpoints([latnew lonnew],0.1);
       
%        C = zeros(length(indnew),1);
%        for hh1 = 1:length(indnew) 
%            
%        end
       
%         figure('units','normalized','outerposition',[0 0 1 1]), hold on
%             plot(lon,lat,'.k')
%             scatter(lonnew,latnew,50,C,'filled')
%             colormap jet

        for hh1 = 1:length(indnew)
            fireid(indnew(hh1)) = (yy-1990)*100000+idoy*1000+C(hh1);
        end
        
        for icluster = 1:length(C)
            if sum(C==icluster)>1
                indnewii = indnew(C==icluster);
                status(indnewii(2:end)) = 2;            
            end
        end
   elseif sum((status==1 & doy==idoy))==1
        indnew = find(status==1 & doy==idoy);
        fireid(indnew) = (yy-1990)*100000+idoy*1000+1;
   end

   indProp = (not(status==0) & not(status==1) & doy==idoy);
   if sum(indProp)>0
       indprop = find(indProp);
       latprop = lat(indprop);
       lonprop = lon(indprop);
       for nn = 1:length(indprop)
           indSurr = fireid>0 & abs((lat-latprop(nn)))<0.3 & abs((lon-lonprop(nn)))<0.5;
           indSurr = find(indSurr);
           if length(unique(fireid(indSurr))) == 1
               fireid(indprop(nn)) = unique(fireid(indSurr));
           else
               minDist2 = distance(latprop(nn),lonprop(nn),lat(indSurr),lon(indSurr));
               dist2site = deg2km(minDist2);
               [bla indMin] = min(dist2site);

               fireid(indprop(nn)) = fireid(indSurr(indMin));
           end
       end
   end
   
   
   
if plotResults2
    scatter(lon(fireid>0),lat(fireid>0),[],fireid(fireid>0),'filled')
    plot(lon(status==1),lat(status==1),'xr','MarkerSize',20)
    plot(lon(status==1),lat(status==1),'+k','MarkerSize',20)
    colormap jet
    caxis([min(doy) 180].*1000)
    title(num2str(idoy))

    pause(0.5)
end
   
   %%
if plotResults1
        plot(lon(status==3 & doy==idoy),lat(status==3 & doy==idoy),'*c','MarkerSize',6)
        plot(lon(status==2),lat(status==2),'*m','MarkerSize',6)
        plot(lon(status==1),lat(status==1),'.r','MarkerSize',20)
        title(num2str(idoy))
        pause(0.5)
%         close all
end


display([num2str(ii) '/' num2str(length(uniquedoy)) ' DONE'])

end

%% Save

OUT = table(doy,lat,lon,status,fireid);
writetable(OUT,['./DATA/ignitions/' sensor '_' num2str(yy) '_Russian_Federation_ignitions_v1-1.csv'])

end


%% merge results
if strcmp(sensor,'modis')
    OUTall = [];
    for yy = 2001:2020
        OUTyy = readtable(['./DATA/ignitions/modis_' num2str(yy) '_Russian_Federation_ignitions_v1-1.csv']);
        year = ones(height(OUTyy),1).*yy;
        OUTall = [OUTall; table(year) OUTyy];
    end
    writetable(OUTall,['./DATA/modis_2001-2020_Russian_Federation_ignitions_v1-1.csv'])
end

%% merge results
if strcmp(sensor,'viirs-snpp')
    OUTall = [];
    for yy = 2012:2020
        OUTyy = readtable(['./DATA/viirs-snpp_' num2str(yy) '_Russian_Federation_ignitions_v1-1.csv']);
        year = ones(height(OUTyy),1).*yy;
        OUTall = [OUTall; table(year) OUTyy];
    end
    writetable(OUTall,['./DATA/viirs-snpp_2012-2020_Russian_Federation_ignitions_v1-1.csv'])
end























    