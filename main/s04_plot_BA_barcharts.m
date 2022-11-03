%% Generate Fig. 2. Annual burned area in the Siberian Arctic

clear all; close all;

years = 1982:2020; 

%% Calculate statistics of burned area
BA = readtable('./DATA/BA_Arctic_allSatellites_v1.csv');
BAdata = table2array(BA(:,2:7))'./1000000;
products = BA.Properties.VariableNames;
products = {products{2:end}};
BAsiberia = nanmedian(BAdata);

BA = readtable('./DATA/BA_Circumpolar_allSatellites_v1.csv');
BAdata = table2array(BA(:,2:7))'./1000000;
products = BA.Properties.VariableNames;
products = {products{2:end}};
BAcircump = nanmedian(BAdata);

display(' ')
display(['Total BA Cicumpolar 1982-2020: ' num2str(nansum(BAcircump)) ' Mha'])
display(['Total BA Siberia 1982-2020: ' num2str(nansum(BAsiberia)) ' Mha'])
display(['Ratio BA Siberia/Cicumpolar 1982-2020: ' num2str(100*nansum(BAsiberia)./nansum(BAcircump)) '%'])
display(['Ratio BA Siberia2019-2020/Siberia1982-2020: ' num2str(100*nansum(BAsiberia(end-1:end))./nansum(BAsiberia)) '%'])
display(' ')


%% Annual burned area in the Siberian Arctic
BA = readtable('./DATA/BA_Arctic_allSatellites_v1.csv');
BAdata = table2array(BA(:,2:7))'./1000000;
products = BA.Properties.VariableNames;
products = {products{2:end}};
BAmedian = nanmedian(BAdata);

%
figure('units','normalized','outerposition',[0 0.3 0.8 0.4]), hold on
bar(BAdata', 'BarWidth', 1)
set(gca,'XTick',1:length(years))
set(gca,'XTickLabel',years)
set(gca,'XTickLabelRotation',45)

h=gca; h.XAxis.TickLength = [0 0];
h.YGrid = 'on';
ylabel('Burned area (Mha)')
set(gca,'fontsize',14)
ylim([0 3])




%% Annual burned area in carbon-rich peatlands
BA = readtable('./DATA/BA_Organic_allSatellites_v1.csv');

BAdata = table2array(BA(:,2:7))'./1000000;
products = BA.Properties.VariableNames;
products = {products{2:end}};
BAmedian = nanmedian(BAdata);

if 0
    figure('units','normalized','outerposition',[0 0.3 0.8 0.4]), hold on
    bar(BAdata', 'BarWidth', 1)
    set(gca,'XTick',1:length(years))
    set(gca,'XTickLabel',years)
    set(gca,'XTickLabelRotation',45)

    h=gca; h.XAxis.TickLength = [0 0];
    h.YGrid = 'on';
    ylabel('Burned area (Mha)')
    set(gca,'fontsize',14)
    ylim([0 1])

end

%
figure('units','normalized','outerposition',[0 0.3 0.8 0.4]), hold on
bar(BAmedian','k', 'BarWidth', 1)
set(gca,'XTick',1:length(years))
set(gca,'XTickLabel',years)
set(gca,'XTickLabelRotation',45)

h=gca; h.XAxis.TickLength = [0 0];
h.YGrid = 'on';
ylabel('Burned area (Mha)')
ylim([0 1])


% SAVE IMAGE as it appear on screen
% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/chart_BApeat.svg'])
% set(gca,'fontsize',14)


% STATS
nansum(BAmedian(end-7:end))/nansum(BAmedian); % BA peat (in %) last 8 years
BAmedian(end)/nansum(BAmedian); % BA peat (in %) in 2020

