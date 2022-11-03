%% Extract carbon emissions from FIRECAM and estimate carbon emissions from
% the IPCC Tier 1 method

clear all; close all;

addpath('./auxiliary_code')

%% Define years and datasets
years = (1982:2020);
SAT = {'GFED','FINN','GFAS','QFED','FEER','IPCC'};

%% Extract low-res BA products (FIRECAM)
% pre-allocate results
Eall = nan(length(years),length(SAT));

% 'GFED'
CO2 = readtable('./DATA/emissions/GFED_CO2.csv');
CO2 = CO2.Total(1:end-1);
CH4 = readtable('./DATA/emissions/GFED_CH4.csv');
CH4 = CH4.Total(1:end-1);
CO2eq = CO2 + CH4*25; % CO2eq = CO2 + CH4*25 + N2O*298;
Eall((end-length(CO2eq)+1):end,1) = CO2eq;

% 'FINN','GFAS','QFED','FEER'
CO2 = readtable('./DATA/emissions/ALL_CO2.csv');
CO2 = table2array(CO2(:,[3 4 5 6]));
CH4 = readtable('./DATA/emissions/ALL_CH4.csv');
CH4 = table2array(CH4(:,[3 4 5 6]));

CO2eq = CO2 + CH4.*25; 

Eall((end-length(CO2eq)+1):end,[2 3 4 5]) = CO2eq;

%% Estimate carbon emissions from IPCC Tier 1 method
% load burned area (tundra and boreal forests)
BAall = readtable('./DATA/BA_Arctic_allSatellites_v1.csv');
BAall = table2array(BAall(:,2:7))'./1000000;
BAtundra = readtable('./DATA/BA_Tundra_allSatellites_v1.csv');
BAtundra = table2array(BAtundra(:,2:7))'./1000000;
BAboreal = BAall-BAtundra;

BAtundra = nanmedian(BAtundra);
BAboreal = nanmedian(BAboreal);

[C CO2eq C_std CO2eq_std C_dist CO2eq_dist] = tier1_ippc(BAtundra, BAboreal, 10^5);

Eall(:,6) = CO2eq;


%% Display statistics
display(' ')
display(['Year 2019: C = ' num2str(C(end-1)) '(sd = ' num2str(C_std(end-1)) ')'])
display(['Year 2019: CO2-eq = ' num2str(CO2eq(end-1)) '(sd = ' num2str(CO2eq_std(end-1)) ')'])
display(' ')

display(' ')
display(['Year 2020: C = ' num2str(C(end)) '(sd = ' num2str(C_std(end)) ')'])
display(['Year 2020: CO2-eq = ' num2str(CO2eq(end)) '(sd = ' num2str(CO2eq_std(end)) ')'])
display(' ')

display(' ')
display(['Year 2020 FIRECAM: CO2-eq = ' num2str(nanmean(Eall(end,1:5),2)) '(sd = ' num2str(nanstd(Eall(end,1:5),[],2)) ')'])
display(' ')


%% Plot results
x = 1:39;
figure('units','normalized','outerposition',[0 0.3 0.8 0.4]), hold on
    plot(x-0.3,Eall(:,1),'hk')
    plot(x-0.2,Eall(:,2),'+k')
    plot(x-0.1,Eall(:,3),'^k')
    plot(x+0.1,Eall(:,4),'vk')
    plot(x+0.2,Eall(:,5),'ok')
    plot(x-0.3,Eall(:,1),'hk','MarkerSize',5)
    plot(x-0.2,Eall(:,2),'+k','MarkerSize',5)
    plot(x-0.1,Eall(:,3),'^k','MarkerSize',5)
    plot(x+0.1,Eall(:,4),'vk','MarkerSize',5)
    plot(x+0.2,Eall(:,5),'ok','MarkerSize',5)
    errorbar(x+0.4,Eall(:,6),CO2eq_std,'.k','CapSize',0)
    legend(SAT)

    set(gca,'XTick',1:length(years))
    set(gca,'XTickLabel',years)
    set(gca,'XTickLabelRotation',45)
    h=gca; h.XAxis.TickLength = [0 0];
    h.YGrid = 'on';
    ylabel('Co2-eq (Tg)')
    set(gca,'fontsize',14)
    ylim([0 350])
    xlim([19 40])
    box on
    
    set(gca,'FontName','Arial','FontSize',14);

%% SAVE IMAGE as it appear on screen
% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/emissions.svg'])


