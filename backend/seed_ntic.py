#!/usr/bin/env python
"""
Script de seed pour intégrer la liste officielle des étudiants NTIC L3
dans la table AllowedStudent.

Exécuter depuis le dossier backend/ :
    python seed_ntic.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reminderbot.settings')
django.setup()

from events.models import AllowedStudent

NTIC_L3_STUDENTS = [
    ("664228662347", "BAH", "ALPHA OUMAR"),
    ("664224582265", "BAH", "ALPHA YAGHOUBA"),
    ("664232192366", "BAH", "DJENABOU"),
    ("664231132374", "BAH", "IBRAHIMA"),
    ("664231482353", "BAH", "ISMAILA"),
    ("664229132377", "BAH", "KADIATOU"),
    ("664216922349", "BAH", "MAMADOU BOBO"),
    ("664232832335", "BAH", "THIERNO MADJOU"),
    ("664224172398", "BALDE", "ADAMA DIAN"),
    ("664222752363", "BARRY", "ABDOULAYE"),
    ("664225302346", "BARRY", "IBRAHIMA"),
    ("664217742389", "BARRY", "MAMADOU"),
    ("664216252383", "BONGONO", "THOMAS"),
    ("664224032272", "CAMARA", "ABDOUL GADIRI"),
    ("664216322330", "CAMARA", "ALSENY"),
    ("664281472391", "CAMARA", "BOUBACAR"),
    ("664226172379", "CAMARA", "YOUSSOUF"),
    ("664227042375", "CONDE", "LAYE OUMAR"),
    ("664274982353", "CONTE", "FATOUMATA"),
    ("664220220365", "DIALLO", "AISSATOU"),
    ("664220892286", "DIALLO", "AMINATA"),
    ("664229002365", "DIALLO", "BOUBACAR"),
    ("664236182335", "DIALLO", "ELHADJ MAMADOU OURY"),
    ("664214252399", "DIALLO", "ELHADJ OUMAR"),
    ("664220922332", "DIALLO", "FANTA"),
    ("664214302377", "DIALLO", "HADJIRATOU"),
    ("664224152336", "DIALLO", "HALIMATOU"),
    ("664214322323", "DIALLO", "IBRAHIMA TALIBE"),
    ("664292612387", "DIALLO", "KADIATOU"),
    ("664224852374", "DIALLO", "MAMADOU HADY"),
    ("664212672327", "DIALLO", "MAMADOU LAMARANA"),
    ("664231212369", "DIALLO", "MAMADOU OUSMANE"),
    ("664215672339", "DIALLO", "MAMADOU SAIDOU"),
    ("664217812359", "DIALLO", "MAMADOU SAMBA"),
    ("664288652328", "DIALLO", "MAMADOU SANOU"),
    ("664218632389", "DIALLO", "MAMOUDOU"),
    ("664214723171", "DIALLO", "MARIAMA TABARA"),
    ("664232642340", "DIALLO", "MARIAME"),
    ("664209622335", "DIALLO", "THIERNO SOULEYMANE"),
    ("664295042320", "DIALLO", "ZAKARIA"),
    ("664217582217", "DIAWARA", "AYE MADY"),
    ("664233082321", "DONZO", "SIGUI"),
    ("664233102340", "DOUKOURE", "VAMBA"),
    ("664223682312", "GADJIGO", "HAMIDOU"),
    ("664225382355", "GBAMOU", "N'OUANAN"),
    ("664233102370", "GBAMOU", "WEAH ROSE"),
    ("664224802379", "KABA", "FANTA"),
    ("664219222296", "KABA", "SANOUSSY"),
    ("664218022382", "KALISSA", "ALPHA"),
    ("664215632396", "KOUROUMA", "DJIBA"),
    ("664233002360", "LOUA", "MARIE ROSE"),
    ("664227192324", "MAMY", "GBO JULES"),
    ("664226922325", "NIAMY", "JEAN ALAIN"),
    ("664265282334", "SANOH", "BINTOU"),
    ("664225332378", "SIDIBE", "MASSIAMY"),
    ("664231042350", "SOW", "AMADOU YERO"),
    ("664215562389", "SOW", "FATIMA ABDUL"),
    ("664215652315", "SOW", "MAMADOU BAILO"),
    ("664267323179", "TOURE", "MOHAMED"),
    ("664221132358", "TRAORE", "FATOUMATA"),
    ("664229622361", "TRAORE", "FATOUMATA"),
]

created = 0
skipped = 0

for matricule, nom, prenom in NTIC_L3_STUDENTS:
    obj, was_created = AllowedStudent.objects.get_or_create(
        matricule=matricule,
        defaults={
            'nom': nom,
            'prenom': prenom,
            'departement': 'NTIC',
            'niveau_licence': 'Licence 3',
        }
    )
    if was_created:
        created += 1
        print(f"  [+] Ajoute : {prenom} {nom} ({matricule})")
    else:
        # Update departement/niveau if already exists
        updated = False
        if obj.departement != 'NTIC':
            obj.departement = 'NTIC'
            updated = True
        if obj.niveau_licence != 'Licence 3':
            obj.niveau_licence = 'Licence 3'
            updated = True
        if updated:
            obj.save()
            print(f"  [*] Mis a jour : {prenom} {nom} ({matricule})")
        else:
            skipped += 1

print(f"\n{'='*50}")
print(f"Seed NTIC L3 termine !")
print(f"   - {created} etudiants ajoutes")
print(f"   - {skipped} etudiants deja presents (ignores)")
print(f"   - Total en base : {AllowedStudent.objects.filter(departement='NTIC').count()} etudiants NTIC")
print(f"{'='*50}")
