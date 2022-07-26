clear all; close all;

roi = imread('./DATA/roi_arctic_CAPE.tif');
roi = [zeros(50,441); roi(:,1:441); zeros(5,441)];
roi = flip(rot90(roi));

%% SAVE sample CAPE
pathFileCAPE = 'CAPE_2011_2020.nc'

finfo = ncinfo(pathFileCAPE);
ncdisp(pathFileCAPE)

lat = double(ncread(pathFileCAPE,'latitude'));
lon = double(ncread(pathFileCAPE,'longitude'));
time = ncread(pathFileCAPE,'time');

for ii = 9

CAPE = ncread(pathFileCAPE,'cape',[1 1 1+2952*ii],[441 101 2952]);

CAPEf =flipud(rot90(mean(CAPE,3)));
figure, imagesc(CAPEf)

title(ii+2011)

% pause
% close all
end

CAPE = ncread(pathFileCAPE,'cape',[1 1 27998],[441 101 1]);

[rows cols bands] = size(CAPE);
R = georasterref('RasterSize', [rows cols bands], ...
    'RasterInterpretation', 'cells', 'ColumnsStartFrom', 'north', 'RowsStartFrom', 'west', ...
    'LatitudeLimits', [min(lat) max(lat)], 'LongitudeLimits', [min(lon) max(lon)]);

geotiffwrite('./figures/CAPE_ind27998',CAPE,R)

%% SAVE hourly estimates Siberia

PERIODS = {'2001_2010','2011_2020'};
roi3d = repmat(roi==1,1,1,2952);

meanCAPE = [];
meanRF = [];

for iperiod = 1:2

    pathFileRF = ['RF_' PERIODS{iperiod} '.nc'];
    pathFileCAPE = ['CAPE_' PERIODS{iperiod} '.nc'];

    meanCAPEii = nan(2952,10);
    meanRFii = nan(2952,10);

    yy = 1;
    h = waitbar(0,'Please wait...');
    for itime = 1:2952:29520
        CAPE = ncread(pathFileCAPE,'cape',[1 1 itime],[441 101 2952]);
        CAPE(not(roi3d)) = NaN;
        % figure, imagesc(CAPE(:,:,1))

        meanCAPEii(:,yy)= squeeze(nanmean(nanmean(CAPE,1),2));

        RF = ncread(pathFileRF,'tp',[1 1 itime],[441 101 2952]);
        meanRFii(:,yy)= squeeze(nanmean(nanmean(RF,1),2));

        yy = yy+1;
        h = waitbar(itime/29520,h)
        yy
    end
    close(h)

    meanCAPE = [meanCAPE meanCAPEii];
    meanRF = [meanRF meanRFii];

end
doyCAPE = 121:243;

save('./DATA/Arctic_CAPE_RF_hourly_2001-2020','meanCAPE','meanRF','doyCAPE')


CAPERFdiv = meanCAPE./meanRF;
CAPERFprod = meanCAPE.*meanRF;

figure, plot(meanCAPE(:),'.')
figure, plot(meanCAPE,'.')

figure, plot(2001:2020,mean(meanCAPE,1),'o')
figure, plot(2001:2020,mean(CAPERFprod,1),'o')
figure, plot(2001:2020,mean(CAPERFdiv,1),'o')