% Generate figure 6. Projected temperatures, annual burned areas (BA), and 
% emissions from fire in the Siberian Arctic.

clear all; close all;

addpath('./auxiliary_code/')

load('./DATA/TAS_summer_hadgem2_rcp45_rcp85.mat') % load CMIP5 summer air temperature averaged over siberia
T = readtable('./DATA/ARCTIC_TRENDS_Ta_LST_LSTera5_Rf_Vcomp_Ucomp_Vpd_Cwd_SoS_EoS_NDVI_v1.csv'); % load factors of fire

%% Linear fit for the ERA5-Land air temperature
ivar = 2;
Y = T.Ta;
X = T.year;
 
[f gof] = fit(X, Y, 'poly1');

lm = fitlm(X,Y);
pvalue = lm.Coefficients.pValue(2);

R2 = gof.rsquare; 
[R pvalR] = corrcoef(f(X),Y);
R2 = R(1,2)^2;
pvalR = pvalR(1,2);

%% Plot Fig. 6

figure('units','normalized','outerposition',[0 0.2 0.33 0.6]), hold on

subplot(4,4,[1 2 5 6]), hold on
    plot(1940:2110,repmat(Y(end),length(1940:2110)),'k')
    plot(1940:2110,repmat(9.929,length(1940:2110)),'k')
    plot(X, Y, '.','MarkerSize',12,'Color',[0.5 0.5 0.5])
    plot(1950:2004,tsRCP45_summer(1:55),'.k')
    plot(2005:2100,tsRCP45_summer(56:end),'.b')
    plot(2005:2100,tsRCP85_summer(56:end),'.r')
    plot(1980:2100,f(1980:2100),'--','Color',[0.5 0.5 0.5])
    xlim([1960 2100])
    ylim([5.5 18])
    set(gca,'XLim',[1960 2100],'XTick',1960:10:2100)
    set(gca,'XTickLabelRotation',45)
    
    set(gca, 'YGrid', 'off', 'XGrid', 'on')
    ax = gca;
    ax.GridColor = [0.6, 0.6, 0.6]; 
    box on
    set(gca,'FontName','Arial','FontSize',10);


    % load burned area projections
    RCP45 = readtable('./DATA/RCP45_all_simulations_results_v1.csv'); % Projections RCP45 all Siberian Arctic
    TREND_BA = table2array(RCP45(:,1:2));
    ba_rcp45all = TREND_BA(:,1)+0.11*TREND_BA(:,1);
    RCP85 = readtable('./DATA/RCP85_all_simulations_results_v1.csv'); % Projections RCP85 all Siberian Arctic
    TREND_BA = table2array(RCP85(:,1:2));
    ba_rcp85all = TREND_BA(:,1)+0.11*TREND_BA(:,1);

    RCP45 = readtable('./DATA/RCP45_peat_simulations_results_v1.csv'); % Projections RCP45 only peatlands
    TREND_BA = table2array(RCP45(:,1:2));
    ba_rcp45peat = TREND_BA(:,1)+0.11*TREND_BA(:,1);
    RCP85 = readtable('./DATA/RCP85_peat_simulations_results_v1.csv'); % Projections RCP85 only peatlands
    TREND_BA = table2array(RCP85(:,1:2));
    ba_rcp85peat = TREND_BA(:,1)+0.11*TREND_BA(:,1);

    
subplot(4,4,[3 4]), hold on
    bar([ba_rcp85peat ba_rcp85all-ba_rcp85peat],'stacked')
    ylim([0 12])
        
    set(gca, 'YGrid', 'off', 'XGrid', 'on')
    ax = gca;
    ax.GridColor = [0.6, 0.6, 0.6]; 
    box on
    set(gca,'FontName','Arial','FontSize',10);

    
subplot(4,4,[7 8]), hold on
    bar([ba_rcp45peat ba_rcp45all-ba_rcp45peat],'stacked')
    ylim([0 12])
    
    set(gca, 'YGrid', 'off', 'XGrid', 'on')
    ax = gca;
    ax.GridColor = [0.6, 0.6, 0.6]; 
    box on
    set(gca,'FontName','Arial','FontSize',10);


    
subplot(4,4,[9 10 13 14]), hold on    

    RCP85all = readtable('./DATA/RCP85_all_simulations_results_v1.csv'); % Projections RCP85 all Siberian Arctic
    RCP45all = readtable('./DATA/RCP45_all_simulations_results_v1.csv'); % Projections RCP45 all Siberian Arctic
    shadedErrorBar(1980:2100,RCP85all.CO2eq(31:end),RCP85all.CO2eq_std(31:end)*2,'lineProps','r');
    shadedErrorBar(1980:2100,RCP45all.CO2eq(31:end),RCP45all.CO2eq_std(31:end)*2,'lineProps','b');

    xlim([1 2100])
	ylim([0 1400])
    set(gca,'XLim',[1980 2100],'XTick',1980:10:2100)
    set(gca,'XTickLabelRotation',45)
    
    set(gca,'YLim',[0 1400],'YTick',0:200:2000)
    set(gca,'YTickLabelRotation',45)
    
    set(gca, 'YGrid', 'on', 'XGrid', 'off')
    ax = gca;
    ax.GridColor = [0.6, 0.6, 0.6]; 
    box on
    set(gca,'FontName','Arial','FontSize',10);

    
subplot(4,4,[11 12 15 16]), hold on      

    RCP85peat = readtable('./DATA/RCP85_peat_simulations_results_v1.csv');
    RCP45peat = readtable('./DATA/RCP45_peat_simulations_results_v1.csv');
    shadedErrorBar(1980:2100,RCP85peat.CO2eq(31:end),RCP85peat.CO2eq_std(31:end)*2,'lineProps','r');
    shadedErrorBar(1980:2100,RCP45peat.CO2eq(31:end),RCP45peat.CO2eq_std(31:end)*2,'lineProps','b');
%     ylabel('CO2-eq PEAT (Tg)')
    
    xlim([2000 2100])
    set(gca,'XLim',[1980 2100],'XTick',1980:10:2100)
    set(gca,'XTickLabelRotation',45)
    
	ylim([0 400])
    set(gca,'YLim',[0 400],'YTick',0:100:400)
    set(gca,'YTickLabelRotation',45)
    
    set(gca, 'YGrid', 'on', 'XGrid', 'off')
    ax = gca;
    ax.GridColor = [0.6, 0.6, 0.6]; 
    box on
    set(gca,'FontName','Arial','FontSize',10);


%% save svg
% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/projections.png'])
% saveas(gcf,['./figures/projections.svg'])


%% Statistics
display(['RATIO direct C EMISSIONS: ' num2str(nanmean(RCP85peat.C./RCP85all.C)) '% +-' num2str(nanstd(RCP85peat.C./RCP85all.C)) '%'])

RCP45 = readtable('./DATA/RCP45_all_simulations_results_v1.csv');
TREND_BA = table2array(RCP45(:,1:2));
ba_rcp45 = TREND_BA(:,1)+0.11*TREND_BA(:,1);
RCP85 = readtable('./DATA/RCP85_all_simulations_results_v1.csv');
TREND_BA = table2array(RCP85(:,1:2));
ba_rcp85 = TREND_BA(:,1)+0.11*TREND_BA(:,1);

years = 1950:2100;
% figure, plot(years, ba_rcp45')

(2050-2020)/sum(ba_rcp45(2020<years & years<2050)>0.5 & ba_rcp45(2020<years & years<2050)<2.5)
sum(ba_rcp45(2020<years & years<2050)>0.5 & ba_rcp45(2020<years & years<2050)<2.5)

% Between 2020 and 2050
indYears = years>2020 & years<2050;

display('RCP85 2020-2050')
mean(RCP85all.C(indYears))
std(RCP85all.C(indYears))

display('RCP85 COeq 2020-2050')
mean(RCP85all.CO2eq(indYears))
std(RCP85all.CO2eq(indYears))

display('RCP85 Proportion peatlands')
mean(RCP85peat.C(indYears)./RCP85all.C(indYears))

% Between 2050 and 2100
indYears = years>2050 & years<2100;

display('RCP85 2050-2100')
mean(RCP85all.C(indYears))
std(RCP85all.C(indYears))

display('RCP85 COeq 2050-2100')
mean(RCP85all.CO2eq(indYears))
std(RCP85all.CO2eq(indYears))

display('RCP85 Proportion peatlands')
mean(RCP85peat.C(indYears)./RCP85all.C(indYears))

display('RCP45 2050-2100')
mean(RCP45all.C(indYears))
std(RCP45all.C(indYears))

display('RCP45 return interval >2.5Mha')
sum(ba_rcp45(indYears)>2.5)





