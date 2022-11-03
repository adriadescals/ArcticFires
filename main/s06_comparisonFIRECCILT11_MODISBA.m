%% Generate supplementary figure 2. Comparison between FireCCILT11, derived 
% from AVHRR, and MCD64A1 and FireCCI51 burned-area products derived from MODIS.

clear all; close all;

%% Load annual burned area
BA = readtable('.\data\BA_Arctic_allSatellites_v1.csv');
BA(isnan(BA.MCD64A1) | isnan(BA.FireCCI51) | isnan(BA.FireCCILT11),:) = [];

% Convert to Mha
AVHRR = BA.FireCCILT11/1000000;
FireCCI51 = BA.FireCCI51/1000000;
MCD64A1 = BA.MCD64A1/1000000;

%% Scatterplot
figure('units','normalized','outerposition',[0 0.3 0.5 0.4]), hold on
subplot(1,2,1), hold on,
xlim([0 1.1])
ylim([0 1.1])
    x = AVHRR;
    y = MCD64A1;
    indnan = not(isnan(x) | isnan(y));
    plot(x(indnan),y(indnan),'.k','MarkerSize',12)
    hline = refline([1 0]);
    hline.Color = 'b';
    grid on
    n = sum(indnan);
    [R pvalue] = (corrcoef(x(indnan),y(indnan))); 
    R2=R(1,2)^2;
    mdl = LinearModel.fit(x(indnan),y(indnan));
    RMSE = mdl.RMSE;
    R2 = mdl.Rsquared.Ordinary;
    slope = mdl.Coefficients.Estimate(2);
    offset = mdl.Coefficients.Estimate(1);
    axis square
    title(['ME=' num2str(nanmean(x-y),'%4.2f') '   RMSE=' num2str(RMSE, '%4.2f') '   {\it R^2}=' num2str(R2,'%4.2f') '   slope=' num2str(slope,'%4.2f')])
    xlabel('Burned area FireCCILT11 (Mha)')
    ylabel('Burned area MCD64A1 (Mha)')
    box on

set(gca,'FontName','Arial');

subplot(1,2,2), hold on,
xlim([0 1.1])
ylim([0 1.1])
    x = AVHRR;
    y = FireCCI51;
    indnan = not(isnan(x) | isnan(y));
    plot(x(indnan),y(indnan),'.k','MarkerSize',12)
    hline = refline([1 0]);
    hline.Color = 'b';
    grid on
    n = sum(indnan);
    [R pvalue] = (corrcoef(x(indnan),y(indnan))); 
    R2=R(1,2)^2;
    mdl = LinearModel.fit(x(indnan),y(indnan));
    RMSE = mdl.RMSE;
    R2 = mdl.Rsquared.Ordinary;
    slope = mdl.Coefficients.Estimate(2);
    offset = mdl.Coefficients.Estimate(1);
    axis square
    title(['ME=' num2str(nanmean(x-y),'%4.2f') '   RMSE=' num2str(RMSE, '%4.2f') '   {\it R^2}=' num2str(R2,'%4.2f') '   slope=' num2str(slope,'%4.2f')])
    xlabel('Burned area FireCCILT11 (Mha)')
    ylabel('Burned area FireCCI51 (Mha)')
    box on


set(gca,'FontName','Arial');


% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/comparison_AVHRR_MODIS.svg'])


