clear all; close all;

%% path to data
pathData = 'C:\Users\adria\OneDrive - CREAF\PALM_PROJECT\_FIRE\_ARCTICfires_paper\R0_raw_backup\CMIP5\bio\dataset-sis-biodiversity-cmip5-global\'


%%
arcticROI = imread('./DATA/roi_arctic_01degrees.tif');
arcticROI = [arcticROI; zeros(12,720)];
figure, imagesc(arcticROI)

%%
RCPyears = 1950:2100;
ishistoric = RCPyears<2005;

rcpmod = 'r2i1p1';
modeltype = 'es';

rcpmod = 'r1i1p1';
modeltype = 'cc';

%% TA RCP45
pathFile = [pathData 'temperature_monthly-mean_hadgem2-' modeltype '_rcp45_' rcpmod '_1950-2100_v1.0' '.nc'];
% tsHS_summer1 = extractCMIP5(pathFile, arcticROI2);

finfo = ncinfo(pathFile);

% extract variables
TIME = ncread(pathFile,'time');
lat = flip(ncread(pathFile,'latitude'));
lon = rot90(ncread(pathFile,'longitude'));
DATA = rot90(ncread(pathFile,'temperature_monthly-mean'))-273.15;
% figure, imagesc(DATA(1:70,:,1))

[rows, cols, months] = size(DATA);
data = reshape(DATA,rows*cols,months);
ts = data(arcticROI(:)==1,:);
tsRCP45 = nanmean(ts,1);
tsRCP45_summer = nanmean([tsRCP45(6:12:length(tsRCP45)); tsRCP45(7:12:length(tsRCP45)); tsRCP45(8:12:length(tsRCP45))]);
% figure, plot(tsRCP45_summer)

% SAVE IMAGES
im6 = DATA(:,:,[6:12:length(tsRCP45)]);
im7 = DATA(:,:,[7:12:length(tsRCP45)]);
im8 = DATA(:,:,[8:12:length(tsRCP45)]);

im = cat(4,im6,im7,im8);
im = nanmean(im,4);
ta = im(1:70,:,:);
ta = uint32((ta+273.15)*1000);
% figure, imagesc(ta(:,:,1))

save(['./DATA/TAS_summer_gridded_hadgem2-' modeltype '_rcp45_' rcpmod '_1950-2100'],'ta','RCPyears','ishistoric')

%% TA RCP85
pathFile = [pathData 'temperature_monthly-mean_hadgem2-' modeltype '_rcp85_' rcpmod '_1950-2100_v1.0' '.nc'];
% tsHS_summer1 = extractCMIP5(pathFile, arcticROI2);

finfo = ncinfo(pathFile);

% extract variables
TIME = ncread(pathFile,'time');
lat = flip(ncread(pathFile,'latitude'));
lon = rot90(ncread(pathFile,'longitude'));
DATA = rot90(ncread(pathFile,'temperature_monthly-mean'))-273.15;

[rows, cols, months] = size(DATA);
data = reshape(DATA,rows*cols,months);
ts = data(arcticROI(:)==1,:);
tsRCP85 = nanmean(ts,1);  

tsRCP85_summer = nanmean([tsRCP85(6:12:length(tsRCP85)); tsRCP85(7:12:length(tsRCP85)); tsRCP85(8:12:length(tsRCP85))]);
% figure, plot(1950:2100,tsRCP85_summer,'o')

% SAVE IMAGES
im6 = DATA(:,:,[6:12:length(tsRCP45)]);
im7 = DATA(:,:,[7:12:length(tsRCP45)]);
im8 = DATA(:,:,[8:12:length(tsRCP45)]);

im = cat(4,im6,im7,im8);
im = nanmean(im,4);
ta = im(1:70,:,:);
ta = uint32((ta+273.15)*1000);
% figure, imagesc(ta(:,:,1))

save(['./DATA/TAS_summer_gridded_hadgem2-' modeltype '_rcp85_' rcpmod '_1950-2100'],'ta','RCPyears','ishistoric')

%% Save a saple image for GEE

figure, imagesc(arcticROI(1:70,:))
figure, imagesc(DATA(1:70,:,1))

[rows cols bands] = size(DATA);
R = georasterref('RasterSize', [rows cols 1], ...
    'RasterInterpretation', 'cells', 'ColumnsStartFrom', 'north', 'RowsStartFrom', 'west', ...
    'LatitudeLimits', [min(lat) max(lat)], 'LongitudeLimits', [min(lon) max(lon)]);

geotiffwrite('./DATA/sample_image_RCP_hadgem2',DATA(:,:,1),R)


%% Correct bias TA
% T = readtable('data.csv');
% 
% [bla, indERA, indRCP] = intersect(T.yy,1950:2004);
% me = mean(tsRCP85_summer(indRCP)'-T.Ta(indERA));  
% tsRCP85_summer = tsRCP85_summer-me;
% 
% [bla, indERA, indRCP] = intersect(T.yy,1950:2000);
% me = mean(tsRCP45_summer(indRCP)'-T.Ta(indERA));  
% tsRCP45_summer = tsRCP45_summer-me;
    

%% Save data
save('./DATA/TAS_summer_hadgem2_rcp45_rcp85','tsRCP45_summer','tsRCP85_summer','RCPyears','ishistoric')







