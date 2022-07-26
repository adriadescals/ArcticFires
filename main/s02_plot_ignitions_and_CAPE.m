clear all; close all;

%%

load('./DATA/Arctic_CAPE_RF_hourly_2001-2020','meanCAPE','meanRF','doyCAPE')

%%
T = readtable(['./DATA/BA_Arctic_FIRMS_perimeters_v1.csv']);
T2 = readtable(['./DATA/modis_2001-2020_Russian_Federation_ignitions_v1-1.csv']);

indOk = T2.lat>66.5 & T2.lon>85;
T2(not(indOk),:) = [];

BA = readtable('G:\My Drive\_ARCTIC_FIRES\_CODE\R1\CLEANED\MAIN\DATA/BA_Arctic_allSatellites_v1-4.csv');
BAdata = table2array(BA(:,2:7))'./1000000;
products = BA.Properties.VariableNames;
products = {products{2:end}};
BAdata = nanmedian(BAdata);
BAdata = BAdata(end-19:end);

for iplot = 1:20 %[1 13 18 19 20]

doys2020 = T.minDoy(T.year==iplot+2000);
doysUnique = unique(doys2020);

doys2020frims = T2.doy(T2.year==iplot+2000);
doysUniquefirms = unique(doys2020frims);
FIRMSacc = [];
for ii = 1:length(doysUniquefirms)
    FIRMSacc = [FIRMSacc sum(doys2020frims<doysUniquefirms(ii))];
end
FIRMSacc = FIRMSacc./max(FIRMSacc);
FIRMSacc = [FIRMSacc 1];
doysUniquefirms = [doysUniquefirms; 244];

figure('units','normalized','outerposition',[0.2 0.2 0.16 0.35]), hold on
    hist(T.minDoy(T.year==iplot+2000),365)
    plot(121:0.0417:244,meanCAPE(3:end,iplot)/10,'.r')
    plot(doysUniquefirms,FIRMSacc*60,'c','LineWidth',2.5)
    ylim([0 60])
    xlim([121 244 ])
    box on
    xlabel('DoY')
    title([num2str(iplot+2000) ' (' num2str(round(BAdata(iplot),2)) ' Mha)'])
    xline(152)
    
set(gca,'XTickLabelRotation',45)
set(gca,'FontName','Arial','FontSize',12);

%% SAVE IMAGE as it appear on screen
set(gcf, 'PaperPositionMode', 'auto')
saveas(gcf,['./figures/CAPE_ignitions_yy' num2str(iplot+2000) '.png'])


end
    


