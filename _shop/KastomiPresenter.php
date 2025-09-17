<?php
namespace App\FrontModule;

use App\Entity\Sklad;
use App\Entity\Soubor;
use Firebase\JWT\JWT;
use Latte\Loaders\StringLoader;
use Nette;
use Nette\Http\Session;
use Nette\Utils\Random;
use function _PHPStan_b8e553790\RingCentral\Psr7\str;
use Nette\Security\Identity;

class KastomiPresenter extends BasePresenter {

    private $dopravneSluzby = [];

    private $stripeSecret = '';

    public $sessionSection;

    private $soubory = [];

    public function __construct(Session $session)
    {

        // a získáme přístup do sekce 'mySection':
        $this->sessionSection = $session->getSection('front');

    }

    public function startup() {

        parent::startup();

        // standardni sluzby
        $this->dopravneSluzby = [
            'zasilkovna' => [
                'nazev' => 'Zásilkovna',
                'cena' => 89
            ],
            'dpd' => [
                'nazev' => 'DPD',
                'cena' => 119
            ],
            // 'ppl' => [
            //     'nazev' => 'PPL',
            //     'cena' => 99
            // ]
        ];

        // Ponožkátor jen dpd
        if($this->salesChannel['internal'] == 'ponozkator_cz') {

            $this->dopravneSluzby = [
                'dpd' => [
                'nazev' => 'DPD',
                'cena' => 119
            ]
            ];

        }
        // tatran pridat osobne
        if($this->salesChannel['internal'] == 'tatran-stresovice') {

            $this->dopravneSluzby['osobni_stresovice'] = [
                'nazev' => 'Osobní odběr Střešovice',
                'cena' => 35,
                'popis' => 'Osobní odběr v budově Tatranu na Sibeliova 368'
            ];

        }
        // Florbal Kladno pridat Tomase
        if($this->salesChannel['internal'] == 'florbal-kladno') {

            $this->dopravneSluzby['tomas_sochor'] = [
                'nazev' => 'Předá mi to Tomáš Sochor',
                'cena' => 0,
                'popis' => 'Na tréninku či při jiné nejbližší příležitosti.'
            ];

        }
        // // Vítkovice SFF
        // if($this->salesChannel['internal'] == 'florbal-vitkovce') {

        //     $this->dopravneSluzby['osobni_sff'] = [
        //         'nazev' => 'Preferuji O2 osobní odběr (zbytek DPD)',
        //         'cena' => 119,
        //         'popis' => 'Pokusíme se doručit, co nejvíce z Vaší objednávky do O2 arény na stánek značky Tempisch. Produkty, které doručit nestihneme, zašleme společností DPD na uvedenou adresu. Předem se omlouváme, pokud na superfinále nedorazí vše, co byste si přáli. Pro doručení uděláme maximum, avšak vzhledem k brzkému termínu Superfinále prosíme, abyste tuto možnost brali spíše jako bonus a nespoléhali se na ní.'
        //     ];

        // }

        // Stripe - Keys should be loaded from environment variables
        $secret = getenv('STRIPE_SECRET_KEY') ?: 'sk_live_...'; // Replace with environment variable
        $secret_dev = getenv('STRIPE_SECRET_KEY_DEV') ?: 'sk_test_...'; // Replace with environment variable

        if($_SERVER["REMOTE_ADDR"] == '81.200.57.109') {
            $secret = $secret_dev;
        }

        $this->stripeSecret = $secret;

    }




    public function beforeRender() {

        parent::beforeRender();

        // pro pouziti kontroly, jak si nastavil sledovani atd.
        $this->template->cookie = $_COOKIE;

        // parametry mohou mit strednik
        $this->template->addFunction('vypsatParametr', function($parametr) {

            if(str_contains($parametr, ";")) {
                $parametry = explode(";", $parametr);

                $line = '';
                foreach($parametry as $p) {
                    $line .= $p.', ';
                }

                $line = substr($line, 0, -2);

                return $line;

            }

            return $parametr;

        });

        $this->template->addFunction('seraditVariantyNechat', function($arr) {
            return $arr;
        });

        $this->template->addFunction('seraditVarianty', function($arr) {

            $hierarchy = [
                "3","5","7","7 - 8", "7 - 8 (dětské)","9", "9-10", "9 - 10 (dětské)","11", "11-12", "11 - 12 (dětské)", "2XS", "XXS", "XS","P-XS","D-XS","P-S", "D-S","S","P-M","D-M", "M","P-L","D-L", "L","P-XL","D-XL", "XL","P-XXL", "D-XXL", "XXL","P-3XL","D-3XL","3XL", "P-4XL","D-4XL", "4XL"
            ];

            // projdu si, jestli nejaka z dodanych hodnot je ta co hledam
            $vyhovuje = false;
            foreach($arr as $val) {

                if(in_array($val, $hierarchy)) {
                    $vyhovuje = true;
                }

            }


            if($vyhovuje === false) { natsort($arr); return $arr; } // pole neradit jinak nez je

            $new_arr = [];
            foreach($hierarchy as $moznost) {

                if(in_array($moznost, $arr)) {
                    $new_arr[] = $moznost;
                }

            }

            // ktere hodnoty se neozbrazily?
            $zbyvajici_hodnoty = array_diff($arr, $new_arr);

            return $new_arr+$zbyvajici_hodnoty;

        });

        // stranky pouziva i menu - musi byt vzdy dostupne
        $this->template->pages = $this->dataModel->zCache("salesWebPages");

        // nastaveni
        $this->template->channel_settings = $this->dataModel->zCache("salesChannelSetting", null, false, "1 hour");
        \Tracy\Debugger::log($this->template->channel_settings);

        // nema vlastni sablonu?
        if($this->template->salesChannel["template"] != "default") {
            $this->setLayout(WWW_ROOT."/../app/modules/FrontModule/templates/Kastomi/Sablony/@".$this->template->salesChannel["template"].".latte");
        }

        // k channelu dat soubory (loga, favicon)
        /*
        $data_soubory = $this->dataModel->zCache("soubory");

        $soubory = [];
        foreach($data_soubory as $ds) {

            if($ds['typ'] != 'hlavni_obrazek') { continue; }

            $id = $ds['relace_id'];
            $soubory[$id] = $ds['cesta'];

        }

        $this->template->channel_soubory = $soubory; */

        $this->template->dopravne_sluzby = $this->dopravneSluzby;

        // pripravit soubory - podle toho ze je hlavni apod
        $data_soubory = $this->dataModel->zCache("soubory");

        $this->soubory = $data_soubory;

        $soubory = [];
        foreach($data_soubory as $ds) {

            if($ds['typ'] != 'hlavni_obrazek') { continue; }

            $id = $ds['relace_id'];
            $soubory[$id] = $ds['cesta'];

        }

        $this->template->soubory = $soubory;



        // Vytvoření mapy pořadí
        $orderMap = array_flip(['3', '4', '5', '6', '6/8', '7', '8', '8/10', '9', '10','10/12', '11', '12','12/14', '13', '14', '15', '16', '3M', '6M', '9M', '12M', '18M', '2XS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL', '4XL']);

        // Přidání funkce do šablony
        $this->template->addFunction('sortByOrderMap', function (array $data, $val_mode = false) use ($orderMap) {
            usort($data, function ($a, $b) use ($val_mode, $orderMap) {

                // je to v klici val
                if($val_mode) {
                    $a = $a['val'];
                    $b = $b['val'];
                }

                $indexA = $orderMap[$a] ?? PHP_INT_MAX;
                $indexB = $orderMap[$b] ?? PHP_INT_MAX;

                return $indexA <=> $indexB;
            });

            return $data;
        });


    }

    public function renderUzivatelRegistrace() {

        if (isset($_POST) && count($_POST) > 0) {

            // sales channel se predava autoamticky
            $data = [];
            $data["role"] = "user";
            $data['email'] = htmlspecialchars(trim($_POST['email']));
            $data['password'] = $_POST['password'];
            $data['jmeno'] = htmlspecialchars(trim($_POST['jmeno']));
            $data['prijmeni'] = htmlspecialchars(trim($_POST['prijmeni']));

            // predat pres api - pokud se vrati success a data, tak nastavit
            $data = $this->dataModel->odeslat("userRegister", $data);

            if ($data['status'] == 'success') {

                $this->flashMessage("Registrace byla úspěšná. Nyní se můžete se svým účtem přihlásit.", "success");
                $this->redirect('uzivatelLogin');

            } else {

                $this->flashMessage($data['message'], 'danger');
                $this->redirect('uzivatelRegistrace');
            }
        }

    }

    public function renderUzivatelOdhlasit() {

        $this->user->logout(true);

        $this->flashMessage("Byli jste odhlášeni. Na viděnou!", "success");
        $this->redirect('sales');

    }

    private function musiBytPrihlasen() {
            if(!$this->getUser()->isLoggedIn()) {
                $this->flashMessage('Pro tuto akci musíte být přihlášen.', 'danger');
                $this->redirect('uzivatelLogin');
            }
    }

    public function renderUzivatelPrehled() {
        $this->musiBytPrihlasen();
    }

    public function renderUzivatelObjednavky() {
        $this->musiBytPrihlasen();
    }

    public function renderUzivatelRezervace() {
        $this->musiBytPrihlasen();

        $this->template->data = $this->dataModel->odeslat("userReservation", ['user_id' => $this->getUser()->getId()]);

        $nabidky = $this->dataModel->zCache("salesOffer");

        $varianty = [];
        foreach($nabidky as $nabidka) {
            foreach($nabidka['variants'] as $variant) {
                $varianty[$variant['id']] = $variant;
                $varianty[$variant['id']]["nabidka"] = $nabidka;
            }
        }

        $this->template->varianty = $varianty;



        $soubory = [];
        foreach($this->soubory as $ds) {

            if($ds['typ'] != 'hlavni_obrazek') { continue; }

            $id = $ds['relace_id'];
            $soubory[$id] = $ds['cesta'];

        }

        $this->template->soubory = $soubory;

    }

    public function renderUzivatelRezervaceOdebrat($sales_offer_variant_id) {

        $this->musiBytPrihlasen();

        $data = [];
        $data["sales_user_id"] = $this->getUser()->getId();
        $data["sales_offer_variant_id"] = $sales_offer_variant_id;

        $data = $this->dataModel->odeslat("userReservationRemove", $data);

        if ($data['status'] == 'success') {

            $this->flashMessage("Rezervace byla odebrána.", "success");

        } else {

            $this->flashMessage("Rezervaci se zřejmě nepodařilo odebrat. Zkuste to prosím později nebo nás kontaktujte.", "danger");

        }

        $this->redirect('uzivatelRezervace');

    }


    public function renderUzivatelUdaje() {
        $this->musiBytPrihlasen();
    }

    public function renderUzivatelLogin()
    {
        if (isset($_POST) && count($_POST) > 0) {

            // predat pres api - pokud se vrati success a data, tak nastavit
            $_POST["role"] = "user";

            $data = $this->dataModel->odeslat("userLogin", $_POST);


            if ($data['status'] == 'success') {

                $userData = [
                    'id' => $data["data"]["id"],
                    'email' => $data["data"]["email"],
                    'jmeno' => $data["data"]['zakaznik']["jmeno"],
                    'prijmeni' => $data["data"]['zakaznik']["prijmeni"]
                ];

                $identity = new Identity($userData['id'], ['user'], $userData);
                $this->getUser()->login($identity);

                $this->flashMessage("Vítejte zpět ve svém účtu :)", "success");
                $this->redirect('uzivatelPrehled');

            } else {

                $this->flashMessage('Zadané přihlašovací údaje nesedí. Zkuste to prosím znovu.', 'danger');
                $this->redirect('uzivatelLogin');
            }
        }
    }

    public function renderUzivatelReset()
    {
        if (isset($_POST) && count($_POST) > 0) {

            // predat pres api - pokud se vrati success a data, tak nastavit
            $data = $this->dataModel->odeslat("userPassReset", $_POST); // todo

            if ($data['status'] == 'success') {
                $this->redirect('sales');

            } else {
                $this->sessionSection->prihlasen = false;
                $this->flashMessage('Zadaný přístup není platný', 'danger');
                $this->redirect('uzivatelLogin');
            }
        }
    }


    // hash je klasicky base64 objednavky
    public function renderStripeResult($hash) {

        $web_order_number = base64_decode($hash);

        // z api musim vytahnout, o jakou jde objednavku
        $data = $this->dataModel->zive("orderPaymentData", ["web_order_number" => $web_order_number]);

        // zjistit stav platby
        $stripe_confirm = new \Stripe\StripeClient(
            $this->stripeSecret
        );

        $data_stripe = $stripe_confirm->paymentIntents->retrieve($data['objednavka']['pay_id']);

        if($data_stripe['status'] == 'succeeded' && ($data_stripe['amount_received'] == $data_stripe['amount'])) {

            $this->dataModel->zive("orderSetPayment", ['order_id' => $data['objednavka']["order_id"], 'amount' => $data['objednavka']["cena"]]);
            $this->flashMessage("Objednávka byla uhrazena. Děkujeme!", "success");

        } else {

            $this->flashMessage("Platba nebyla úspěšná. Doporučujeme to později zkusit znovu. Odkaz na platbu naleznete v emailu.", "danger");

        }



        $this->redirect('podekovani');

    }


    // pro testovani - co chodi v datech
    public function renderData() {


//        $data = $this->dataModel->zive("orderPaymentId", ["web_order_number" => 230063, 'pay_id' => "dopsalo_api"]);

 //       dumpe($data);

        // test loginu
        /*
        $_POST = [];
        $_POST['email'] = 'aa';
        $_POST['password'] = 'bb';

        $data = $this->dataModel->odeslat("userLogin", $_POST);

        dumpe($data); */

//        $d = $this->dataModel->zive("orderNumber");

//        dumpe($d);

        dump($this->dataModel->zCache("salesChannel"));

        dump($this->dataModel->zCache("salesChannelSetting"));

        dump($this->dataModel->zCache("salesOffer"));

        dump($this->dataModel->zCache("soubory"));

        dump($this->dataModel->zCache("salesWebPages"));

        dump($this->dataModel->zCache("salesUsers"));

        dump($this->dataModel->zCache("salesCategory"));

        exit;

    }

    public function renderSalesWebPage($sales_web_page_id) {
    
        if($this->salesChannel['internal'] == 'kastomi-vysivky') {
            $this->setLayout("sablona_vysivky");
        }
    
        if($this->salesChannel['internal'] == 'kastomi-vysivky' && $sales_web_page_id =="26") {
            $this->setView("sablona/Vysivky/kastomiVysivkyMainPage");
        }
    
        foreach($this->template->pages as $page) {
            if($page['id'] == $sales_web_page_id) {
                $this->template->row = $page;
                break;
            }
        }
    }

    public function renderVymazatCache() {

        $cache = $this->dataModel->internePripravCache();
        $cache->clean([Nette\Caching\Cache::ALL => true]);

        $this->flashMessage("Cache vymazána", "success");
        $this->flashMessage("Stránka byla znovu načtena", "info");

        $this->redirect("sales");

    }

    public function renderSales() {
        
        if($this->salesChannel['internal'] == 'kastomi-vysivky') {
            $this->setLayout("sablona_vysivky");
            $this->setView("sablona/Vysivky/kastomiVysivkySales");
        }

        $this->template->rows = $rows = $rows_all = $this->dataModel->zCache("salesOffer");


        // pokud je filtr aktivni, tak se nactou jen ty
        $filtry = [];
        foreach($rows_all as $row) {

            if($row["sales_offer_status_id"] == 3) { continue; } // archivovane nebrat v potaz pro filtr
            if($row["active_channel"] == 0) { continue; } // neaktivni nabidky nebrat v potaz pro filtr

            // parametry z varianty
            foreach ($row['variants'] as $variant) {


                foreach ($variant['params'] as $param) {

                    if ($param['param']['show'] == 1 && $param['val'] != '') {

                        $klic = $param['param']['name'];

                        if (!isset($filtry[$klic])) {
                            $filtry[$klic] = [];
                        }


                        $vals = explode(";", $param['val']);

                        foreach($vals as $v) {
                            if($v != '') {
                                $filtry[$klic][] = $v;
                            }
                        }

                        // pridat tu hodnotu
                        //$filtry[$klic][] = $param['val'];

                    }

                }

            }

            // parametry primo z nabidky
            foreach ($row['params'] as $param) {

                if ($param['param']['show'] == 1 && $param['val'] != '') {

                    $klic = $param['param']['name'];

                    if (!isset($filtry[$klic])) {
                        $filtry[$klic] = [];
                    }

                    // pridat tu hodnotu
                    $vals = explode(";", $param['val']);

                    foreach($vals as $v) {
                        if($v != '') {
                            $filtry[$klic][] = $v;
                        }
                    }

                    //$filtry[$klic][] = $param['val'];

                }

            }

        }


        foreach($filtry as $key => $val) {
            $filtry[$key] = array_unique($val);
            asort($filtry[$key]);
        }


        $this->template->filtry = $filtry;


        if(isset($_GET['filtr'])) {

            // nechat jen ty, co splnuji
            $filtred_rows = [];
            foreach($rows_all as $r) {

                if($r["sales_offer_status_id"] == 3) { continue; } // archivovane nebrat v potaz pro filtr
                if($r["active_channel"] == 0) { continue; } // neaktivni nabidky nebrat v potaz pro filtr

                // hledame podle hodnoty parametru
                if(isset($_GET['hodnota'])) {
                    foreach ($r['variants'] as $variant) {

                        foreach ($variant['params'] as $param) {

                            if ($param['param']['show'] == 1 && $param['val'] != '') {

                                $klic = $param['param']['name'];

                                /*
                                if ($klic == $_GET['filtr'] && $param['val'] == $_GET['hodnota']) {
                                    $filtred_rows[] = $r;
                                } */

                                if ($klic == $_GET['filtr'] && str_contains($param['val'],$_GET['hodnota'])) {
                                    $filtred_rows[] = $r;
                                }


                            }

                        }

                    }

                    foreach ($r['params'] as $param) {

                        if ($param['param']['show'] == 1 && $param['val'] != '') {

                            $klic = $param['param']['name'];


                            if ($klic == $_GET['filtr'] && str_contains($param['val'],$_GET['hodnota'])) {
                                $filtred_rows[] = $r;
                            }


                        }

                    }



                } else {



                        if(str_contains(strtolower($r['name']), strtolower($_GET['q']))) {
                            $filtred_rows[] = $r;
                        }


                }

            }

            $this->template->aktivni_filtr = $_GET['filtr'];

            if(isset($_GET['hodnota'])) {
                $this->template->aktivni_filtr_hodnota = $_GET['hodnota'];
            }


            $outputArray = [];
            $seenIds = [];

            foreach ($filtred_rows as $item) {
                if (!in_array($item['id'], $seenIds)) {
                    $outputArray[] = $item;
                    $seenIds[] = $item['id'];
                }
            }


            $this->template->rows = $rows = $outputArray;

        }


        // projit zbozi a sestavit validni parametry - ty co jsou vyplnene, ty co se maji zobrazovat - bereme to z jendolivych variant
        $category_sorted = $this->dataModel->zCache("salesCategory");

        // ze zbozi nacist vsechny kategorie, ktere se tam objevily
        // funguji jako nadpisy na strance
        $category = [];
        foreach($category_sorted as $cat) {
            $has_filtered_items = false;
        
            // Check if there are filtered items in this category
            foreach($rows as $row) {
                foreach($row['kategorie'] as $k) {
                    if($row["sales_offer_status_id"] == 3) { continue; } // archivovane nebrat v potaz pro filtr
                        if($k['id'] == $cat['id']) {
                            $has_filtered_items = true;
                            break 2;
                        }
                    
                }
            }
        
            if($has_filtered_items) {
                $category[$cat['id']] = $cat['name'];
            }
        }
        
        $this->template->category = $category;
        

        $soubory = [];
        foreach($this->soubory as $ds) {

            if($ds['typ'] != 'hlavni_obrazek') { continue; }

            $id = $ds['relace_id'];
            $soubory[$id] = $ds['cesta'];

        }

        $this->template->soubory = $soubory;

        $soubory = [];
        foreach($this->soubory as $ds) {

            if($ds['typ'] != 'obrazek[]') { continue; }

            $soubory[] = [$ds['tag'], $ds['cesta']];


        }

        $this->template->obrazky_varianty = $soubory;


    }

    public function renderSalesOffer($seo) {

        if($this->salesChannel['internal'] == 'kastomi-vysivky') {
            $this->setLayout("sablona_vysivky");
            $this->setView("sablona/Vysivky/kastomiVysivkySalesOffer");
        }


        // // prepnout na starou sablonu, pokud neni pripravene
        // $pk_nova_sablona = [];
        // $pk_nova_sablona[] = "tatran-stresovice";
        // $pk_nova_sablona[] = "fbs-slavia-plzen";
        // $pk_nova_sablona[] = "kanonyri-kladno";
        // $pk_nova_sablona[] = "fc-fiction-united";
        // $pk_nova_sablona[] = "vk-jihostroj-ceske-budejovice";
        // $pk_nova_sablona[] = "ponozkator_cz";
        // $pk_nova_sablona[] = "sk-kladno";
        // $pk_nova_sablona[] = "tatran-cviceni-deti";
        // $pk_nova_sablona[] = "kobl-dance";
        // $pk_nova_sablona[] = "el-nino-praha";
        // $pk_nova_sablona[] = "bluehorses-stochov";
        // $pk_nova_sablona[] = "sokol-nehvizdy";
        // $pk_nova_sablona[] = "danceway";
        // $pk_nova_sablona[] = "florbal-chodov";
        // $pk_nova_sablona[] = "fk-olympie-zdice";
        // $pk_nova_sablona[] = "troopers";
        // $pk_nova_sablona[] = "tenisdeza";
        // $pk_nova_sablona[] = "florbal-vitkovce";
        // $pk_nova_sablona[] = "leontinka";
        // $pk_nova_sablona[] = "jimi-rugby-club";
        // $pk_nova_sablona[] = "vikings-koprivnice";


        // if(!in_array($this->salesChannel['internal'], $pk_nova_sablona)) {
        //     $this->setView("salesOfferOld");
        // }


        foreach($this->dataModel->zCache("salesOffer") as $row) {
            if($row['seo'] == $seo) {
                $this->template->row = $row;
                break;
            }
        }

        dump($row);

        if($row["sales_offer_status_id"] == 3 && isset($_GET["pko"]) && base64_decode($_GET["pko"]) == $row["id"]) {
            $this->flashMessage("Tato nabídka je skrytá a lze ji zobrazit pouze pomocí tohoto odkazu.", "warning");
        }

        elseif($row["sales_offer_status_id"] == 3) {
            $this->flashMessage("Požadovaný odkaz již není dostupný.", "warning");
            $this->flashMessage("Snad Vám uděláme radost následující nabídkou :)", "success");
            $this->redirect("sales");
        }
        elseif($row["active_channel"] == 0) {
            $this->flashMessage("Požadovaný odkaz již není dostupný.", "warning");
            $this->flashMessage("Snad Vám uděláme radost následující nabídkou :)", "success");
            $this->redirect("sales");
        }


        $data_soubory = $this->soubory;

        $this->template->hlavni_obrazek = false;
        foreach($data_soubory as $ds) {

            if($ds['relace_id'] != $this->template->row['id']) { continue; }
            if($ds['typ'] != 'hlavni_obrazek') { continue; }

            $this->template->hlavni_obrazek = $ds['cesta'];

        }


        $soubory = [];
        foreach($data_soubory as $ds) {

            if($ds['relace_id'] != $this->template->row['id']) { continue; }
            if($ds['typ'] != 'obrazek[]') { continue; }

            $soubory[] = $ds['cesta'];

        }


        $this->template->dalsi_obrazky = $soubory;


  // vysivky maji soubory podle variant
  if($this->salesChannel['internal'] == 'kastomi-vysivky') {

    $soubory = [];
    $mam = false;
    foreach($data_soubory as $ds) {

        if($ds['relace_id'] != $this->template->row['id']) { continue; }
        if($ds['typ'] != 'obrazek[]') { continue; }

        $soubory[] = [$ds['tag'], $ds['cesta']];

        // hlavni obrazek je prvni varianta
        if($mam === false) {
            $this->template->hlavni_obrazek = $ds['cesta'];
        }

        $mam = true;

    }

    $this->template->obrazky_varianty = $soubory;


    // soubory ke stazeni
    $soubory = [];
    foreach($data_soubory as $ds) {

        if($ds['relace_id'] != $this->template->row['id']) { continue; }
        if($ds['typ'] != 'download[]') { continue; }

        $soubory[] = [$ds['cesta'], $ds["nazev"]];

    }


    $this->template->soubory_ke_stazeni = $soubory;



}

        // soubory etiketa
        $soubory = [];
        foreach($data_soubory as $ds) {

            if($ds['relace_id'] != $this->template->row['id']) { continue; }
            if($ds['typ'] != 'nahled_etiketa') { continue; }

            $soubory[] = $ds['cesta'];

        }

        $this->template->soubory_etiketa = $soubory;

    }

    public function renderKosik() {

        //$this->sessionSectionWeb['kosik_polozky'] = [];

        //dump($this->sessionSectionWeb['kosik_polozky']);



        // beta fiction
        if($this->salesChannel['internal'] == 'fc-fiction-united') {
            $this->template->channel_delivery = $this->dataModel->zCache("salesChannelDelivery");

            //dump($this->template->channel_delivery);
        }

        $this->template->sales_offers = $this->dataModel->zCache("salesOffer");
        dump($this->template->sales_offers);

    }

    public function renderKosikUdaje() {



    }

    // hash je v base64 cislo objednavky
    public function renderPlatebniBranaStripe($hash)
    {

        $web_order_number = base64_decode($hash);

        // z api musim vytahnout, o jakou jde objednavku
        $data = $this->dataModel->zive("orderPaymentData", ["web_order_number" => $web_order_number]);


        if ($data["status"] == "error") {
            die("Odkaz není platný");
        }

        // presmerovat na branu - jeste podle stavu jestli uz je zaplaceny nebo ne
        if ($data["objednavka"]["zaplaceno"] == 1) {
            $this->flashMessage('Objednávka je již uhrazená :)', 'success');
            $this->redirect('sales');
        }

        \Stripe\Stripe::setApiKey($this->stripeSecret);

        $checkout_session = \Stripe\Checkout\Session::create([
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => 'czk',
                    'product_data' => [
                        'name' => 'Kastomi - Objednávka č. ' . $data["objednavka"]["order_id"],
                    ],
                    'unit_amount_decimal' => $data["objednavka"]["cena"]*100,
                ],
            ]],
            'mode' => 'payment',
            'success_url' => $this->link("//stripeResult", $hash),
            'cancel_url' => $this->link("//stripeResult", $hash)
        ]);


        // zapsat k objednavce payment intent
        $data = $this->dataModel->zive("orderPaymentId", ["web_order_number" => $web_order_number, 'pay_id' => $checkout_session->payment_intent]);

        header("HTTP/1.1 303 See Other");
        header("Location: " . $checkout_session->url);
        exit;

    }

    // hash je v base64 cislo objednavky
    public function renderPlatebniBranaCsob($hash) {

        $web_order_number = base64_decode($hash);

        // z api musim vytahnout, o jakou jde objednavku
       $data = $this->dataModel->zive("orderPaymentData", ["web_order_number" => $web_order_number]);


        if($data["status"] == "error") {
            die("Odkaz není platný");
        }

        // presmerovat na branu - jeste podle stavu jestli uz je zaplaceny nebo ne
        if($data["objednavka"]["zaplaceno"] == 1) {
            $this->flashMessage('Objednávka je již uhrazená :)', 'success');
            $this->redirect('default');
        }


        // presmerovat na platbu
        // kdyz prijde vickrat, dostane jine csob_id ale
        $client = $this->bankClient();

        $payment = new \OndraKoupil\Csob\Payment($web_order_number);
        $payment->addCartItem("Váš nákup", 1, $data["objednavka"]["cena"]*100); // sloucit castku za dopravu i cenu zbozi

        $response = $client->paymentInit($payment);

        // zapsat k objednavce csob_id
        $data = $this->dataModel->zive("orderPaymentId", ["web_order_number" => $web_order_number, 'pay_id' => $payment->getPayId()]);


        // presmerovat na branu
        $client->redirectToGateway($payment);
        exit;

    }


    // vola se z kosiku
    public function handlePolozkaUpdateKs() {

        // upravit pocet
        $polozky_all = $this->sessionSectionWeb['kosik_polozky'];

        $polozky = [];
        foreach($polozky_all as $p) {
            if($p['id'] == $_POST['polozka_id']) {
                $p['pocet'] = $_POST['pocet'];
            }
            $polozky[] = $p;
        }

        $this->sessionSectionWeb['kosik_polozky'] = $polozky;


        // prepposlat session
        $this->template->session = $this->sessionSectionWeb;


        $this->flashMessage($this->translator->translate("Počet kusů byl upraven a cena přepočítána"), "success");
        $this->redrawControl();

    }

    public function renderRezervaceDokoncit() {

        if (isset($_POST) && count($_POST) > 0) {

            foreach($_POST["quantity"] as $variant_id => $quantity) {

                if($quantity > 0) {
                $data = $this->dataModel->odeslat("userSetReservation", ['sales_user_id' => $this->getUser()->getId(), 'sales_offer_variant_id' => $variant_id, 'quantity' => $quantity]);

                    // todo - checkovat ze se nevyskytne zadna chyba
                    \Tracy\Debugger::log($data);

                }

            }

            $this->flashMessage("Rezervace byla dokončena. Děkujeme!", "success");
            $this->redirect("uzivatelRezervace");

        }

    }

    public function renderSkladDoKosiku() {

        if(!isset($_POST['sales_offer_variant_id']) || $_POST['sales_offer_variant_id'] == '') {
            $this->flashMessage('Nevybrali jste variantu. Zkuste to prosím znovu.', 'warning');
            $this->redirect('sales');
        }

        $variant_final = '';
        foreach($this->dataModel->zCache("salesOffer") as $row) {
            foreach($row['variants'] as $variant) {
                if ($variant['id'] == $_POST['sales_offer_variant_id']) {
                    $this->template->row = $row;
                    $variant_final = $variant['variant'];
                    break;
                }
            }
        }

        $row = $this->template->row;


        // jedinecne id - aktualni cas
        $polozky = $this->sessionSectionWeb['kosik_polozky'];

        // pro testovani resetovat
        //$polozky = [];

        // overit, jestli uz to tam neni
        // nemzu to pridavat, pokud to ma neco z kastomi - protoze muze chtit treba jine napisy
        $polozky_nove = [];
        foreach($polozky as $p) {
            if($p['sales_offer_variant_id'] == $_POST['sales_offer_variant_id'] && !isset($_POST["kastomi"])) {
                // nepridavat
                $_POST['pocet'] = $_POST['pocet']+$p["pocet"];
            } else {
                $polozky_nove[] = $p;
            }
        }


        $nova_polozka = [
            'id' => 'gid'.time(),
            'sales_offer_variant_id' => $_POST['sales_offer_variant_id'],
            'pocet' => $_POST['pocet'],
            'cena_ks' => $row['price'],
            'cena_ks_velkoobchodni' => $row['wholesale_price'],
            'sales_offer_id' => $row['id'],
            'name' => $row['name'],
            'seo' => $row['seo'],
            'variant' => $variant_final
        ];


        // pripravit si kastomi data
        // pocitat s tim ze tech kastomizaci muze byt vice
        if(isset($_POST['kastomi']) && count($_POST['kastomi']) > 0) {

            $nova_polozka["kastomi"] = [];

            $cena_priplatek_celkem = 0;
            foreach($_POST['kastomi'] as $kastomi_id => $vyplnena_hodnota) {

                if(trim($vyplnena_hodnota) == '') { continue; } // nechce Kastomizaci

                $cena_priplatek = 0;

                $settings = [];
                $settings_all = [];
                foreach($row["kastomi"] as $kastomi) {
                    if($kastomi["id"] == $kastomi_id) {
                        $settings_all = $kastomi["settings_all"];
                        $settings_values = $kastomi["settings"];
                        break;
                    }
                }

                // nacist, ktere hodnoty maji jit
                foreach($settings_all as $s) {
                    if($s["setting_type"] == "price") {
                        //$cena_priplatek = $s['default_value'];
                        $cena_priplatek = $settings_values[$s['setting_name']];
                        $cena_priplatek_celkem += $cena_priplatek;
                        continue;
                    }
                    if($s['send_data'] == 0) { continue; }

                    // hodnotu vzit ze settings
                    $settings[$s['setting_name']] = $settings_values[$s['setting_name']];
                }


                // vlozit vyplnennou hodnotu
                $settings["Uživatelský vstup"] = $vyplnena_hodnota;


                $nova_polozka["kastomi"][$kastomi_id] = $settings;

            }

            $nova_polozka["cena_priplatek"] = $cena_priplatek_celkem;

            // upravit cena ks - aby uz obsahovala priplatek za vsechny Kastomizace
            $nova_polozka["cena_ks"] = $nova_polozka["cena_ks"]+$cena_priplatek_celkem;


        }


        // pridat do finalniho pole
        $polozky_nove[] = $nova_polozka;

        $this->sessionSectionWeb['kosik_polozky'] = $polozky_nove;


        $link_kosik = $this->link('//kosik');

        $this->flashMessage("Produkt byl vložen do košíku. <a href='".$link_kosik."'>Zobrazit košík</a>", "success");

        $this->redirect('salesOffer', $row['seo']);

    }

    public function handleKosikPolozkaOdebrat($id_polozka) {

        // prochazet polozky a uz tam nedavat tu co prichazi
        $polozky_all = $this->sessionSectionWeb['kosik_polozky'];

        $polozky = [];
        foreach($polozky_all as $p) {
            if($p['id'] != $id_polozka) {
                $polozky[] = $p;
            }
        }

        $this->sessionSectionWeb['kosik_polozky'] = $polozky;

        $this->template->session = $this->sessionSectionWeb;

        bdump($this->template->session);

        $this->flashMessage("Položka byla odebrána", "success");
        $this->redrawControl();

    }

    public function renderObjednat() {

        if(isset($_POST) && count($_POST) > 0) {

            $session = $this->sessionSectionWeb;

            $session['kosik'] = $_POST; // pro ted prehodim

            /*

            // aktualizovat pocet
            foreach($_POST['pocet'] as $id => $pocet) {
                $arr = [];
                $arr["pocet"] = $pocet; // dulezite je nastavovat co posila - aby se to nemohlo rozjeit

                //$this->database->table('web_objednavka_polozka')->where('id', $id)->update($arr);
            } */

            if(count($session['kosik_polozky']) == 0) {

                $this->flashMessage("Je nám líto, než jste stihli objednat košík se vyprázndil :(", "warning");
                $this->flashMessage("Vaší objednávku si nechceme nechat ujít, vytvořte ji prosm znovu", "success");

                \Tracy\Debugger::log($_SERVER['REMOTE_ADDR']." - jiz neplatny kosik");

                $this->redirect("kosik");

            }


            if(!isset($_POST['platba']) || !isset($_POST['doprava']) or $_POST['platba'] == '' or $_POST['doprava'] == '') {

                $this->flashMessage("Musíte zvolit platbu a dopravu", "warning");
                $this->redirect("kosik");

            }


            // modul order
            $arr = [];
            $arr["cas_objednani"] = new \DateTime;
            //$arr["hash"] = "dokonceno_".$web_objednavka->hash;
            $arr['hash_platba'] = time().Random::generate(16); // kdyby chtel zaplatit znova

            //$this->database->table("web_objednavka")->where("id", $web_objednavka->id)->update($arr);

            //$web_objednavka = $this->database->table("web_objednavka")->where("id", $web_objednavka->id)->fetch();

            $country_code = 'CZE';
            $navyseni_dopravne = 0;

            // beta - fiction
            if(isset($_POST["stat_id"])) {

                // najit - nastavit informace
                $channel_delivery = $this->dataModel->zCache("salesChannelDelivery");

                foreach($channel_delivery["delivery"] as $ch) {
                    if($ch["stat"]["id"] == $_POST["stat_id"]) {
                        $country_code = $ch["stat"]["iso3"];

                        if($ch["delivery_surcharge"] > 0) {
                            $navyseni_dopravne = $ch["delivery_surcharge"];
                        }

                        $doklad_dph_id = $ch["doklad_dph_id"];

                        break;
                    }
                }

            }

            // vytvorim si objednavku - pro uplne novou
            $payload = [];
            $payload[] = [
                'module' => 'customer',
                'method' => 'insert',
                'key' => 'zakaznik_1',
                'data' => [
                    'name' => $_POST['jmeno'],
                    'surname' => $_POST['prijmeni'],
                    'lang' => 'cz', // protoze neumim jiny
                ],
            ];


            // pokud je to zasilkovna, tak vytvorit jako dalsi adresu
            if($_POST['doprava'] == 'zasilkovna') {

                // hlavni adresa - to kde je ta zasilkovna
                $payload[] = [
                    'module' => 'address',
                    'method' => 'insert',
                    'key' => 'prva_adresa',
                    'data' => [
                        'type' => 'zasilkovna',
                        'company' => $_POST['zasilkovna_firma'],
                        'customer_id' => '{zakaznik_1.id}',
                        'name' => $_POST['jmeno'],
                        'surname' => $_POST['prijmeni'],
                        'street' => $_POST['zasilkovna_ulice'],
                        'city' => $_POST['zasilkovna_mesto'],
                        'zip' => $_POST['zasilkovna_psc'],
                        'country_code' => $country_code,
                        'type_sign' => $_POST['zasilkovna_id']
                    ],
                ];

                $payload[] = [
                    'module' => 'address',
                    'method' => 'insert',
                    'key' => 'adresa_zakaznika',
                    'data' => [
                        'company' => '',
                        'customer_id' => '{zakaznik_1.id}',
                        'name' => $_POST['jmeno'],
                        'surname' => $_POST['prijmeni'],
                        'street' => $_POST['ulice'],
                        'city' => $_POST['mesto'],
                        'zip' => $_POST['psc'],
                        'country_code' => $country_code,
                    ],
                ];


            } else {

                // bezna adresa (pro postu, dpd apod)
                $payload[] = [
                    'module' => 'address',
                    'method' => 'insert',
                    'key' => 'prva_adresa',
                    'data' => [
                        'company' => '',
                        'customer_id' => '{zakaznik_1.id}',
                        'name' => $_POST['jmeno'],
                        'surname' => $_POST['prijmeni'],
                        'street' => $_POST['ulice'],
                        'city' => $_POST['mesto'],
                        'zip' => $_POST['psc'],
                        'country_code' => $country_code,
                    ],
                ];

            }


            $payload[] = [
                'module' => 'contact',
                'method' => 'insert',
                'key' => 'kontakt_prvni',
                'data' => [
                    'customer_id' => '{zakaznik_1.id}',
                    'type' => 'email',
                    'data' => trim($_POST['email']),
                ],
            ];

            $payload[] = [
                'module' => 'contact',
                'method' => 'insert',
                'key' => 'kontakt_druhy',
                'data' => [
                    'customer_id' => '{zakaznik_1.id}',
                    'type' => 'phone',
                    'data' => trim($_POST['full_number']),
                ],
            ];


            // modul objednavka
            $cena_celkem = 0;

            foreach($session['kosik_polozky'] as $polozka) {
                $cena_celkem = $cena_celkem+($polozka['cena_ks']*$polozka['pocet']);
            }

            // k cene pricist dopravu
            // dopravne urcim podle klice
            $vybrane_dopravne = $this->dopravneSluzby[$_POST['doprava']];

            $cena_doprava = $vybrane_dopravne['cena'];

            // pokud ma dopravne navyseni
            if($navyseni_dopravne > 0) {
                $cena_doprava = $cena_doprava+$navyseni_dopravne;
            }


            $web_objednavka_cislo = $this->dataModel->zive("orderNumber");
            $web_objednavka_cislo = $web_objednavka_cislo['number'];
            //$web_objednavka_cislo = "test";


            $module = [];
            $module["module"] = "order";
            $module["method"] = "insert";
            $module["key"] = "rand_key_order".\Nette\Utils\Random::generate(10);

            $klic_objednavka = $module["key"];

            $module["data"] = [];
            $module["data"]["customer_id"] = '{zakaznik_1.id}';
            $module["data"]["customer_confirmation_email_id"] = '{kontakt_prvni.id}';
            $module["data"]["customer_confirmation_mobil_id"] = '{kontakt_druhy.id}';


            $module["data"]["total_price"] = $cena_celkem+$cena_doprava;
            $module["data"]["campaign_id"] = null;
            $module["data"]["web_id"] = $web_objednavka_cislo;
            $module["data"]["date"] = date("Y-m-d H:i:s");
            $module["data"]["currency_code"] = "Kc";
            $module["data"]["payment_type"] = $_POST['platba'];
            $module["data"]["delivery_type"] = $_POST['doprava'];
            $module["data"]["payment_link_csob"] = $this->link('//platebniBranaStripe', base64_encode($web_objednavka_cislo));
            $module["data"]["payment_link_paypal"] = null;

            $module["data"]["www"]["lang"] = '';
            $module["data"]["www"]["ip"] = '';
            $module["data"]["www"]["browser"] = '';
            $module["data"]["www"]["domain"] = $this->template->salesChannel['url'];
            $module["data"]["www"]["sales_channel_id"] = $this->template->salesChannel['id'];

            $payload[] = $module;

            $aktualni_index = 0;

            // vybrat vsechny zakazniky, kteri maji neco objednaneho
            if($this->salesChannel['internal'] == 'fc-fiction-united') {
                $odecist_z_objednavky = 0;
            }

            foreach($session['kosik_polozky'] as $polozka) {

                $aktualni_index++;

                $module = [];
                $module["module"] = "order_item";
                $module["method"] = "insert";
                $module["key"] = "rand_key_orderitem" . \Nette\Utils\Random::generate(10);

                $module["data"]["order_id"] = "{" . $klic_objednavka . ".id}";

                $module["data"]["customer_giver_id"] = null;
                $module["data"]["customer_giver_contacts"][0] = null;
                $module["data"]["customer_giver_contacts"][1] = null;
                $module["data"]["customer_giver_adrress_id"] = null;

                $module["data"]["customer_recipient_id"] = '{zakaznik_1.id}'; // musi byt relace
                $module["data"]["customer_recipient_address_id"] = '{prva_adresa.id}';
                $module["data"]["customer_recipient_contacts"][0] = '{kontakt_prvni.id}';
                $module["data"]["customer_recipient_contacts"][1] ='{kontakt_druhy.id}';

                // potrebuju ten produkt najit, abych vedel, co ma za produktovy_kod a sklad id
                $rows_offers = $this->dataModel->zCache("salesOffer");

                $mam = false;
                foreach($rows_offers as $offer) {
                    foreach($offer['variants'] as $variant) {
                        if($variant['id'] == $polozka['sales_offer_variant_id']) {

                            $mam = $variant;
                            $mam_offer = $offer;

                        }

                    }
                }


                // domluveno zatim natvrdo 21%
                $doklad_dph_id = 4; // id z bob kastomi

                if(isset($doklad_dph_id)) {
                    $prirazka_dph_id = $doklad_dph_id;
                }

                // klubova prirazka
                $rozdil = 0;
                if($mam_offer['price'] != $mam_offer['wholesale_price']) {

                    $rozdil = $mam_offer['price'] - $mam_offer['wholesale_price'];

                    $podpora = true;

                    if($this->salesChannel['internal'] == 'fc-fiction-united') {

                        $prirazka_dph_id = 1; // nastavuje 0% dph pro prirazku - kdyz se bude pouzivat

                        if(isset($_POST["podpora_klubu"])) {
                            $podpora = true;
                        } else {
                            $podpora = false;
                            $odecist_z_objednavky = $odecist_z_objednavky+($rozdil*$polozka['pocet']);
                        }

                    }

                    // jeste kontrola, jak jsem nastavil podporu - pokud jsem ji odmitnul, tak nepridvat
                    if($rozdil > 0 && $podpora === true) {
                        // vygenerovat si a pridat taky
                        $module_prirazka = $module;

                        $module_prirazka["data"]["product_code"] = 'KLUBOVA_PRIRAZKA'; // taky prenaset pres api

                        $module_prirazka["data"]["unit_price"] = $rozdil;
                        $module_prirazka["data"]["units_count"] = $polozka['pocet'];
                        $module_prirazka["data"]["company_token"] = "";

                        // dph - pokud je
                        if(isset($prirazka_dph_id)) {
                            $module_prirazka["data"]["tax_id"] = $prirazka_dph_id;
                        }

                        $module_prirazka["data"]["params"] = [];
                        $module_prirazka["data"]["params"]["name"] = "Klubová podpora k " . $mam_offer["name"];

                        $payload[] = $module_prirazka;
                    }

                }


                $module["data"]["product_code"] = $mam["product_recipe_code"];

                $module["data"]["unit_price"] = $polozka['cena_ks']-$rozdil;
                $module["data"]["units_count"] = $polozka['pocet'];
                $module["data"]["company_token"] = "";

                if(isset($doklad_dph_id)) {
                    $module["data"]["tax_id"] = $doklad_dph_id;
                }


                $module["data"]["params"] = [];
                $module["data"]["params"]["name"] = $mam_offer["name"]." - varianta ".$mam["variant"]; // pro vlastni nazev na dokladech apod.
                $module["data"]["params"]["product_code"] = $mam['sklad_kod']; // kod ze skladu - asi musi zustat pro ponozkove motivy
                $module["data"]["params"]["sales_offer_variant_id"] = $mam['id']; // standardni postup pro NABIDKA

                if(isset($polozka["kastomi"])) {

                    $module["data"]["params"]["kastomi_data"] = serialize($polozka["kastomi"]);

                    // pridat do nazvu
                    $module["data"]["params"]["name"] = $module["data"]["params"]["name"]." + kastomizace";

                    // pokud obsahuje warehouse digital, tak musim predat  jinem foruatu
                    foreach($polozka["kastomi"] as $id_kastomi => $kastomi) {
                        if(isset($kastomi["warehouse_digital_id"])) {

                            $module["data"]["params"]["label_id"] = $kastomi["warehouse_digital_id"];

                            // + musim predat etiketu tak jak je to vymysleno - zbavit se toho, ze je to takto naprimo
                            $module["data"]["params"]["label_custom_text"] = $kastomi["Uživatelský vstup"];

                        }
                    }

                }

                $payload[] = $module;

            } // !polozky

            // jeste zpetne aktualizovat cenu, pokud se odecita podpora


            // 4 je modul - pokud jsou vzdy stejne. mozna malinko vylepsit
            if(isset($odecist_z_objednavky)) {
                $payload[4]["data"]["total_price"] = $payload[4]["data"]["total_price"]-$odecist_z_objednavky;
            }


            // poslat polozku dopravy
            $module = [];
            $module["module"] = "order_item";
            $module["method"] = "insert";
            $module["key"] = "rand_key_orderitem" . \Nette\Utils\Random::generate(10);

            $module["data"]["order_id"] = "{" . $klic_objednavka . ".id}";

            $module["data"]["customer_giver_id"] = null;
            $module["data"]["customer_giver_contacts"][0] = null;
            $module["data"]["customer_giver_contacts"][1] = null;
            $module["data"]["customer_giver_adrress_id"] = null;

            $module["data"]["customer_recipient_id"] = '{zakaznik_1.id}'; // musi byt relace
            $module["data"]["customer_recipient_address_id"] = '{prva_adresa.id}';
            $module["data"]["customer_recipient_contacts"][0] = '{kontakt_prvni.id}';
            $module["data"]["customer_recipient_contacts"][1] ='{kontakt_druhy.id}';

            $module["data"]["product_code"] = 'DOPRAVA_PLATBA'; // taky prenaset pres api

            $module["data"]["unit_price"] = $cena_doprava;
            $module["data"]["units_count"] = 1;
            $module["data"]["company_token"] = "";

            if(isset($doklad_dph_id)) {
                $module["data"]["tax_id"] = $doklad_dph_id;
            }


            $module["data"]["params"] = [];
            $module["data"]["params"]["name"] = "Dopravné a balné";

            dump($module);

            $payload[] = $module;

            // poslat do API
            $privateKey = <<<EOD
-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQC8kGa1pSjbSYZVebtTRBLxBz5H4i2p/llLCrEeQhta5kaQu/Rn
vuER4W8oDH3+3iuIYW4VQAzyqFpwuzjkDI+17t5t0tyazyZ8JXw+KgXTxldMPEL9
5+qVhgXvwtihXC1c5oGbRlEDvDF6Sa53rcFVsYJ4ehde/zUxo6UvS7UrBQIDAQAB
AoGAb/MXV46XxCFRxNuB8LyAtmLDgi/xRnTAlMHjSACddwkyKem8//8eZtw9fzxz
bWZ/1/doQOuHBGYZU8aDzzj59FZ78dyzNFoF91hbvZKkg+6wGyd/LrGVEB+Xre0J
Nil0GReM2AHDNZUYRv+HYJPIOrB0CRczLQsgFJ8K6aAD6F0CQQDzbpjYdx10qgK1
cP59UHiHjPZYC0loEsk7s+hUmT3QHerAQJMZWC11Qrn2N+ybwwNblDKv+s5qgMQ5
5tNoQ9IfAkEAxkyffU6ythpg/H0Ixe1I2rd0GbF05biIzO/i77Det3n4YsJVlDck
ZkcvY3SK2iRIL4c9yY6hlIhs+K9wXTtGWwJBAO9Dskl48mO7woPR9uD22jDpNSwe
k90OMepTjzSvlhjbfuPN1IdhqvSJTDychRwn1kIJ7LQZgQ8fVz9OCFZ/6qMCQGOb
qaGwHmUK6xzpUbbacnYrIM6nLSkXgOAwv7XXCojvY614ILTK3iXiLBOxPu5Eu13k
eUz9sHyD6vkgZzjtxXECQAkp4Xerf5TGfQXGXhxIX52yH+N2LtujCdkQZjXAsGdm
B2zNzvrlgRmgBrklMTrMYgm1NPcW+bRLGcwgW2PTvNM=
-----END RSA PRIVATE KEY-----
EOD;


            //dumpe($payload);
            //die("konec");

            $jwt = JWT::encode($payload, $privateKey, 'RS256');

            try {

                $client = new \GuzzleHttp\Client(['verify' => false]);
                $headers = [
                    'content_type' => 'application/x-www-form-urlencoded',
                    'body' => \json_encode($jwt)
                ];


                $domena = 'https://bob.kastomi.com/';

                if (@$_SERVER['SERVER_ADDR'] === '127.0.0.1' || @$_SERVER['SERVER_ADDR'] === '::1') {
               $domena = 'https://loc/juxon/bob/web/';
                    //$domena = 'https://bob.kastomi.com/';
                }

                $response = $client->request('POST', $domena.'api/v3/queue?_tracy_skip_error', $headers);

                $body = $response->getBody()->getContents(); // nepouzivam

            }
            catch (\GuzzleHttp\Exception\BadResponseException $e) {

                // zalogovat si pro vlastni potreba do info logu
                // ale zpracovani skriptu jde dal
                \Tracy\Debugger::log("Bob odpovedel chybou na objednavku ".$e->getMessage());

                // zalogovat post a session
                \Tracy\Debugger::log($_POST);
                \Tracy\Debugger::log($_SESSION);

                dump("bob odpovedel chybu:");
                dumpe($e);

            }


            // odstranit polozky (nastaveni kosiku muzu nechat)
            $this->sessionSectionWeb['kosik_polozky'] = [];

            if($_POST['platba'] == 'karta') {

                //$this->redirect('//platebniBranaCsob', base64_encode($web_objednavka_cislo));
                $this->redirect('//platebniBranaStripe', base64_encode($web_objednavka_cislo));

            } else {

                $this->redirect("podekovani");

                //$web_objednavka = $this->database->table("web_objednavka")->where("id", $web_objednavka->id)->fetch();

                //$this->redirect("podekovani", ['h' => base64_encode($web_objednavka->hash)]);

            }


        }

    }



    private function bankClient($rezim = 'ostra') {

        $rezim = "develop";
        if($rezim == 'develop') {

            $config = new \OndraKoupil\Csob\Config(
                "M1EPAY0839",
                WWW_ROOT . "../data_certifikaty/rsa_M1EPAY0839.key",
                WWW_ROOT . "../data_certifikaty/mips_iplatebnibrana.csob.cz.pub",
                "Kastomi (dev)",

                // Adresa, kam se mají zákazníci vracet poté, co zaplatí
                $this->template->baseUrl . "/eshop/karta-zpracovani",

                // URL adresa API - výchozí je adresa testovacího (integračního) prostředí,
                // až budete připraveni přepnout se na ostré rozhraní, sem zadáte
                // adresu ostrého API. Nezapomeňte také na ostrý veřejný klíč banky.
                \OndraKoupil\Csob\GatewayUrl::TEST_LATEST
            );

        } else {

            // ostra verze
            $config = new \OndraKoupil\Csob\Config(
                "M1EPAY0839",
                WWW_ROOT . "../data_certifikaty/rsa_M1EPAY0839.key",
                WWW_ROOT . "../data_certifikaty/mips_platebnibrana.csob.cz.pub",
                "Kastomi",

                // Adresa, kam se mají zákazníci vracet poté, co zaplatí
                $this->template->baseUrl . "/eshop/karta-zpracovani",

                // URL adresa API - výchozí je adresa testovacího (integračního) prostředí,
                // až budete připraveni přepnout se na ostré rozhraní, sem zadáte
                // adresu ostrého API. Nezapomeňte také na ostrý veřejný klíč banky.
                \OndraKoupil\Csob\GatewayUrl::PRODUCTION_LATEST
            );

        }


        $client = new \OndraKoupil\Csob\Client($config);

        return $client;

    }

    public function renderVratitPlatbu() {

        $client = $this->bankClient();

        $data = $client->paymentReverse("69524ff8de4a@IE");

        dump($data);
        exit;

    }

    public function renderKartaZpracovani() {

        $client = $this->bankClient();

        $response = $client->receiveReturningCustomer();

        \Tracy\Debugger::log($response);

        if (in_array($response["paymentStatus"], [4, 7, 8])) {

            // poslat platbu pres api

            // potrebuju poslat order_id a amount
            // podle pay_id si to nejprve potrebuju vytahnout od BOba

            $data = $this->dataModel->zive("orderPaymentData", ["pay_id" => $response["payId"]]);


            $this->dataModel->zive("orderSetPayment", ['order_id' => $data['objednavka']["order_id"], 'amount' => $data['objednavka']["cena"]]);


            // nebo také 4, záleží na nastavení closePayment
            // zaplaceno

            /*
            $arr = [];
            $arr['zaplaceno'] = 1;

            $this->database->table('web_objednavka')->where('csob_id', $response['payId'])->update($arr);


            $row = $web_objednavka = $this->database->table('web_objednavka')->where('csob_id', $response['payId'])->fetch(); */

            //$this->uhradaObjednavkyApi($row->id);

            // pres api poslat uhradu - asi na to vyuzit klasicky payment, ktery umime


            $this->flashMessage("Objednávka byla uhrazena. Děkujeme!", "success");
            $this->redirect("podekovani");

        } else {

            // logovat - zaplaceni nenp
            $this->flashMessage("Platba nebyla úspěšná. Doporučujeme to později zkusit znovu. Odkaz na platbu naleznete v emailu.", "danger");
            $this->redirect('podekovani');

        }


    }

   public function renderKartaTest() {

        // klice verejne pro banku jsou zde - pozor je jiny pro testovaci prostredi a pro test
        // https://github.com/csob/paymentgateway/tree/master/keys
        // testovaci karty here https://github.com/csob/paymentgateway/wiki/Testovac%C3%AD-karty

        $client = $this->bankClient();

        try {
            $client->testGetConnection();
            $client->testPostConnection();

            print "Testy ok";

        } catch (\Exception $e) {
            echo "Something went wrong: " . $e->getMessage();
        }

        die("");

        $cena = 123;
        $cena_doprava = 77;

        $payment = new \OndraKoupil\Csob\Payment("3");
        $payment->addCartItem("Váš nákup", 1, ($cena+$cena_doprava)*100); // sloucit castku za dopravu i cenu zbozi

        $response = $client->paymentInit($payment);

        \Tracy\Debugger::log($response);

        $payId = $payment->getPayId(); // abych si ulozil k transakci - jednoznacny identifikator

       \Tracy\Debugger::log($payId);

        // presmerovat na branu
        $client->redirectToGateway($payment);

        die("konec");

    }


}
