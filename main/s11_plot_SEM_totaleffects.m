% Generate figure of direct and indirect effects of fire-related factors 
% on burned area (Fig. S8)

clear all; close all

vars = {'Temperature','Precipitation','VPD','Length of season','NDVI','Water deficit','Ignitions'};
E = [0 0.673; 0 -0.057; 0 0.494; 0 0.206; 0 0.173; 0.46 0.206; 0.48 0]; % Obtained from 'u01_SEM.R'

[bla indSort] = sort(sum(E,2),'descend');

vars = {vars{indSort}}
E = E(indSort,:);

figure('units','normalized','outerposition',[0.3 0.3 0.2 0.5]), hold on
ba = bar(E,'stacked','BarWidth', 0.7, 'FaceColor','flat')
set(gca,'XTick',1:length(vars))
set(gca,'XTickLabel',vars)
set(gca,'XTickLabelRotation',45)
set(gca, 'YGrid', 'on', 'XGrid', 'off')
ba(1).CData = [1 1 1]*0.2;
ba(2).CData = [1 1 1]*0.7;
ylim([-0.15 0.75])
box on

% set font type when exporting to svg
set(gca,'FontName','Arial','FontSize',13);


%% SAVE IMAGE as it appear on screen
% set(gcf, 'PaperPositionMode', 'auto')
% saveas(gcf,['./figures/SEM_direct_indirect_effects.svg'])


