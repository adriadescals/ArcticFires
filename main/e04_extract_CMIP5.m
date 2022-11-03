%% Extracts CMIP5 data (.nc) and save it in .mat format

clear all; close all;

%% path to data
% CMIP data can be downloaded at https://doi.org/10.24381/cds.a37fecb7
% The data is not provided in the GitHub repository
pathData = '../large_datasets/CMIP5/';

%% Define region of interest
arcticROI = imread('./DATA/roi_arctic_01degrees.tif');
arcticROI = [arcticROI; zeros(12,720)];
figure, imagesc(arcticROI)

%% Define time period and model
RCPyears = 1950:2100;
ishistoric = RCPyears<2005;

% rcpmod = 'r2i1p1';
% modeltype = 'es';

rcpmod = 'r1i1p1';
modeltype = 'cc';

%% Extact TA RCP45 
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

%% Extact TA RCP85
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

%% Save a sample image for GEE
figure, imagesc(arcticROI(1:70,:))
figure, imagesc(DATA(1:70,:,1))

[rows cols bands] = size(DATA);
R = georasterref('RasterSize', [rows cols 1], ...
    'RasterInterpretation', 'cells', 'ColumnsStartFrom', 'north', 'RowsStartFrom', 'west', ...
    'LatitudeLimits', [min(lat) max(lat)], 'LongitudeLimits', [min(lon) max(lon)]);

geotiffwrite('./DATA/sample_image_RCP_hadgem2',DATA(:,:,1),R)


%% Save data in .mat
save('./DATA/TAS_summer_hadgem2_rcp45_rcp85','tsRCP45_summer','tsRCP85_summer','RCPyears','ishistoric')







