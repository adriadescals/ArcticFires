%% Generate supplementary figure 6. Histograms of ignition and active fire detections, 
% and the convective available potential energy in the Siberian Arctic.

clear all; close all;

%% Load hourly CAPE data averaged over the Siberian Arctic
load('./DATA/Arctic_CAPE_hourly_2001-2020','meanCAPE','doyCAPE')

%% Load FIRMS ignitions
IGN = readtable(['./DATA/modis_2001-2020_Russian_Federation_ignitions_v1-1.csv']);
indOk = IGN.lat>66.5 & IGN.lon>85; % Define region of interest
IGN(not(indOk),:) = [];

%% Load annual burned area
BA = readtable('./DATA/BA_Arctic_allSatellites_v1.csv');
BAdata = table2array(BA(:,2:7))'./1000000; % Convert to Mha
products = BA.Properties.VariableNames;
products = {products{2:end}};
BAdata = nanmedian(BAdata);
BAdata = BAdata(end-19:end);

%% Generate figure
for iplot = 1:20 % years from 2001 to 2020

doys2020frims = IGN.doy(IGN.year==iplot+2000);
doysUniquefirms = unique(doys2020frims);
FIRMSacc = [];
for ii = 1:length(doysUniquefirms)
    FIRMSacc = [FIRMSacc sum(doys2020frims<doysUniquefirms(ii))];
end
FIRMSacc = FIRMSacc./max(FIRMSacc);
FIRMSacc = [FIRMSacc 1];
doysUniquefirms = [doysUniquefirms; 244];

figure('units','normalized','outerposition',[0.2 0.2 0.16 0.35]), hold on
    hist(IGN.doy(IGN.status==1 & IGN.year==iplot+2000),365,'FaceColor','black','EdgeColor','black')
    plot(121:0.0417:244,meanCAPE(3:end,iplot)/10,'.r')
    plot(doysUniquefirms,FIRMSacc*40,'c','LineWidth',2.5)
    ylim([0 40])
    xlim([121 244 ])
    box on
    xlabel('DoY')
    title([num2str(iplot+2000) ' (' num2str(round(BAdata(iplot),2)) ' Mha)'])
    xline(152)
    
set(gca,'XTickLabelRotation',45)
set(gca,'FontName','Arial','FontSize',12);

% % SAVE IMAGE as it appear on screen
% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/CAPE_ignitions_yy' num2str(iplot+2000) '.png'])

end
    


